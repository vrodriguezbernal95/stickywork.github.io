// Dashboard Module

const dashboard = {
    businessSettings: {}, // Store business settings including WhatsApp config

    // Load dashboard with stats and recent bookings
    async load() {
        const contentArea = document.getElementById('contentArea');
        document.getElementById('pageTitle').textContent = 'Dashboard';

        try {
            // Load stats
            const statsData = await api.get(`/api/stats/${auth.getBusinessId()}`);
            const stats = statsData.data;

            // Load recent bookings
            const bookingsData = await api.get(`/api/bookings/${auth.getBusinessId()}`);
            const allBookings = bookingsData.data;
            const bookings = allBookings.slice(0, 10); // Last 10 bookings

            // Get today's bookings
            const now = new Date();
            const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
            const todayBookings = allBookings.filter(booking =>
                booking.booking_date.startsWith(today) &&
                booking.status !== 'cancelled'
            ).sort((a, b) => a.booking_time.localeCompare(b.booking_time));

            // Guardar para uso en modales
            this.todayBookings = todayBookings;

            // Process trend data (last 7 weeks)
            const trendData = this.processTrendData(allBookings);

            // Calculate month comparison
            const monthComparison = this.calculateMonthComparison(allBookings);

            // Calculate revenue data
            const revenueData = this.calculateRevenue(allBookings);

            // Calculate cancellation rate
            const cancellationRate = this.calculateCancellationRate(allBookings);

            // Calculate peak hours
            const peakHoursData = this.calculatePeakHours(allBookings);

            // Calculate monthly revenue (last 6 months)
            const monthlyRevenue = this.calculateMonthlyRevenue(allBookings);

            // Load business info
            const businessData = await api.get(`/api/business/${auth.getBusinessId()}`);
            document.getElementById('businessName').textContent = businessData.data.name;

            // Store business settings including WhatsApp configuration
            this.businessSettings = {
                whatsappEnabled: businessData.data.whatsapp_enabled,
                whatsappNumber: businessData.data.whatsapp_number,
                whatsappTemplate: businessData.data.whatsapp_template,
                businessName: businessData.data.name
            };

            // Store booking_settings for WhatsApp message templates
            this.bookingSettings = businessData.data.booking_settings
                ? (typeof businessData.data.booking_settings === 'string'
                    ? JSON.parse(businessData.data.booking_settings)
                    : businessData.data.booking_settings)
                : {};

            // Load action box data in parallel
            const d2 = new Date();
            d2.setDate(d2.getDate() + 1);
            const tomorrowStr = `${d2.getFullYear()}-${String(d2.getMonth() + 1).padStart(2, '0')}-${String(d2.getDate()).padStart(2, '0')}`;
            const [tomorrowRes, feedbackRes, cancelledRes] = await Promise.all([
                api.get(`/api/bookings/${auth.getBusinessId()}?date=${tomorrowStr}`),
                api.get(`/api/admin/feedback/pending/${auth.getBusinessId()}`),
                api.get(`/api/bookings/${auth.getBusinessId()}/cancelled-future`)
            ]);
            this.tomorrowBookings = (tomorrowRes.data || []).filter(b => b.status !== 'cancelled');
            this.feedbackPending  = feedbackRes.data || [];
            this.cancelledFuture  = cancelledRes.data || [];

            // Render dashboard
            contentArea.innerHTML = `
                <!-- 4 Action Boxes -->
                ${this.renderActionBoxes(todayBookings)}

                <!-- Today's Agenda Widget -->
                <div style="margin: 2rem 0;">
                    <div style="background: linear-gradient(135deg, var(--primary-color), var(--secondary-color)); border-radius: 15px; padding: 1.5rem; box-shadow: 0 8px 20px rgba(46, 53, 245, 0.2);">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                            <h2 style="margin: 0; color: white; font-size: 1.5rem; display: flex; align-items: center; gap: 0.75rem;">
                                <span style="font-size: 2rem;">📋</span>
                                Agenda de Hoy
                            </h2>
                            <div style="background: rgba(255, 255, 255, 0.2); padding: 0.5rem 1rem; border-radius: 8px; color: white; font-weight: 600;">
                                ${new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                            </div>
                        </div>

                        ${todayBookings.length === 0 ? `
                            <div style="background: rgba(255, 255, 255, 0.1); backdrop-filter: blur(10px); border-radius: 12px; padding: 2rem; text-align: center; color: white;">
                                <div style="font-size: 3rem; margin-bottom: 0.5rem;">✨</div>
                                <p style="margin: 0; font-size: 1.1rem; font-weight: 500;">¡Día libre! No hay reservas programadas para hoy.</p>
                            </div>
                        ` : `
                            <div style="display: grid; gap: 1rem;">
                                ${todayBookings.map(booking => this.renderTodayBooking(booking)).join('')}
                            </div>
                        `}
                    </div>
                </div>

                <!-- Trends Chart Widget -->
                <div style="margin: 2rem 0;">
                    <div style="background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 15px; padding: 1.5rem; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);">
                        <div style="margin-bottom: 1.5rem;">
                            <h2 style="margin: 0 0 0.5rem 0; color: var(--text-primary); font-size: 1.5rem; display: flex; align-items: center; gap: 0.75rem;">
                                <span style="font-size: 2rem;">📈</span>
                                Tendencia de Reservas
                            </h2>
                            <p style="margin: 0; color: var(--text-secondary); font-size: 0.9rem;">
                                Evolución semanal de las últimas 7 semanas
                            </p>
                        </div>

                        ${this.renderTrendChart(trendData)}
                    </div>
                </div>

                <!-- Month Comparison Widget -->
                <div style="margin: 2rem 0;">
                    <div style="background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 15px; padding: 1.5rem; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);">
                        <h2 style="margin: 0 0 1.5rem 0; color: var(--text-primary); font-size: 1.5rem; display: flex; align-items: center; gap: 0.75rem;">
                            <span style="font-size: 2rem;">📊</span>
                            Comparativa Mensual
                        </h2>

                        ${this.renderMonthComparison(monthComparison)}
                    </div>
                </div>

                <!-- Peak Hours & Monthly Revenue -->
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(350px, 1fr)); gap: 2rem; margin: 2rem 0;">
                    <!-- Peak Hours Chart -->
                    <div style="background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 15px; padding: 1.5rem; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);">
                        <h2 style="margin: 0 0 1.5rem 0; color: var(--text-primary); font-size: 1.3rem; display: flex; align-items: center; gap: 0.75rem;">
                            <span style="font-size: 1.5rem;">🕐</span>
                            Horas Punta
                        </h2>
                        ${this.renderPeakHours(peakHoursData)}
                    </div>

                    <!-- Monthly Revenue Chart -->
                    <div style="background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 15px; padding: 1.5rem; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);">
                        <h2 style="margin: 0 0 1.5rem 0; color: var(--text-primary); font-size: 1.3rem; display: flex; align-items: center; gap: 0.75rem;">
                            <span style="font-size: 1.5rem;">💰</span>
                            Ingresos Mensuales
                        </h2>
                        ${this.renderMonthlyRevenue(monthlyRevenue)}
                    </div>
                </div>

                <!-- Recent Bookings Table -->
                <div class="table-container">
                    <div class="table-header">
                        <div class="table-title">Reservas Recientes</div>
                    </div>

                    ${bookings.length === 0 ? `
                        <div class="empty-state">
                            <div class="empty-state-icon">📅</div>
                            <p>No hay reservas todavía</p>
                        </div>
                    ` : `
                        <table class="table">
                            <thead>
                                <tr>
                                    <th>Cliente</th>
                                    <th>Servicio</th>
                                    <th>Fecha</th>
                                    <th>Hora</th>
                                    <th>Estado</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${bookings.map(booking => `
                                    <tr>
                                        <td>
                                            <div style="font-weight: 600;">${booking.customer_name}</div>
                                            <div style="font-size: 0.85rem; color: var(--text-secondary);">${booking.customer_email}</div>
                                        </td>
                                        <td>${booking.service_name || 'N/A'}</td>
                                        <td>${new Date(booking.booking_date).toLocaleDateString('es-ES')}</td>
                                        <td>${booking.booking_time}</td>
                                        <td>
                                            <span class="status-badge status-${booking.status}">
                                                ${this.getStatusLabel(booking.status)}
                                            </span>
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    `}
                </div>

                <!-- Estadísticas Generales (moved to bottom) -->
                <div style="margin: 2rem 0 0 0;">
                    <h2 style="margin: 0 0 1.25rem 0; color: var(--text-primary); font-size: 1.3rem; display: flex; align-items: center; gap: 0.75rem;">
                        <span style="font-size: 1.5rem;">📊</span>
                        Estadísticas Generales
                    </h2>
                    <div class="stats-grid">
                        <div class="stat-card" style="cursor: pointer; transition: transform 0.2s ease;"
                             onclick="dashboard.openBookingsModal('all')"
                             onmouseover="this.style.transform='translateY(-5px)'"
                             onmouseout="this.style.transform='translateY(0)'">
                            <div class="stat-icon" style="background: rgba(59, 130, 246, 0.1);">📊</div>
                            <div class="stat-content">
                                <div class="stat-value">${stats.totalBookings || 0}</div>
                                <div class="stat-label">Total Reservas</div>
                            </div>
                        </div>

                        <div class="stat-card" style="cursor: pointer; transition: transform 0.2s ease;"
                             onclick="dashboard.openBookingsModal('month')"
                             onmouseover="this.style.transform='translateY(-5px)'"
                             onmouseout="this.style.transform='translateY(0)'">
                            <div class="stat-icon" style="background: rgba(34, 197, 94, 0.1);">📅</div>
                            <div class="stat-content">
                                <div class="stat-value">${stats.thisMonth || 0}</div>
                                <div class="stat-label">Reservas Este Mes</div>
                                ${monthComparison.change !== 0 ? `
                                    <div style="margin-top: 0.5rem; display: flex; align-items: center; justify-content: center; gap: 0.5rem;">
                                        <span style="color: ${monthComparison.change > 0 ? '#22c55e' : '#ef4444'}; font-weight: 700; font-size: 0.9rem;">
                                            ${monthComparison.change > 0 ? '▲' : '▼'} ${Math.abs(monthComparison.percentage)}%
                                        </span>
                                        <span style="color: var(--text-tertiary); font-size: 0.8rem;">vs mes anterior</span>
                                    </div>
                                ` : monthComparison.lastMonth > 0 ? `
                                    <div style="margin-top: 0.5rem; font-size: 0.8rem; color: var(--text-tertiary);">≈ Igual que mes anterior</div>
                                ` : ''}
                            </div>
                        </div>

                        <div class="stat-card" style="cursor: pointer; transition: transform 0.2s ease;"
                             onclick="dashboard.openBookingsModal('pending')"
                             onmouseover="this.style.transform='translateY(-5px)'"
                             onmouseout="this.style.transform='translateY(0)'">
                            <div class="stat-icon" style="background: rgba(234, 179, 8, 0.1);">⏳</div>
                            <div class="stat-content">
                                <div class="stat-value">${stats.bookingsByStatus.find(s => s.status === 'pending')?.count || 0}</div>
                                <div class="stat-label">Pendientes</div>
                            </div>
                        </div>

                        <div class="stat-card" style="cursor: pointer; transition: transform 0.2s ease;"
                             onclick="dashboard.openBookingsModal('confirmed')"
                             onmouseover="this.style.transform='translateY(-5px)'"
                             onmouseout="this.style.transform='translateY(0)'">
                            <div class="stat-icon" style="background: rgba(34, 197, 94, 0.1);">✅</div>
                            <div class="stat-content">
                                <div class="stat-value">${stats.bookingsByStatus.find(s => s.status === 'confirmed')?.count || 0}</div>
                                <div class="stat-label">Confirmadas</div>
                            </div>
                        </div>

                        <div class="stat-card" style="cursor: pointer; transition: transform 0.2s ease;"
                             onclick="dashboard.openBookingsModal('cancelled')"
                             onmouseover="this.style.transform='translateY(-5px)'"
                             onmouseout="this.style.transform='translateY(0)'">
                            <div class="stat-icon" style="background: rgba(239, 68, 68, 0.1);">❌</div>
                            <div class="stat-content">
                                <div class="stat-value">${stats.cancelledFuture || 0}</div>
                                <div class="stat-label">Canceladas</div>
                                <div style="margin-top: 0.5rem; font-size: 0.8rem; color: var(--text-tertiary);">(próximos 7 días)</div>
                            </div>
                        </div>

                        <div class="stat-card" style="transition: transform 0.2s ease;"
                             onmouseover="this.style.transform='translateY(-5px)'"
                             onmouseout="this.style.transform='translateY(0)'">
                            <div class="stat-icon" style="background: rgba(16, 185, 129, 0.1);">💰</div>
                            <div class="stat-content">
                                <div class="stat-value">${revenueData.thisMonth.toFixed(0)}€</div>
                                <div class="stat-label">Ingresos Este Mes</div>
                                ${revenueData.change !== 0 ? `
                                    <div style="margin-top: 0.5rem; display: flex; align-items: center; justify-content: center; gap: 0.5rem;">
                                        <span style="color: ${revenueData.change > 0 ? '#22c55e' : '#ef4444'}; font-weight: 700; font-size: 0.9rem;">
                                            ${revenueData.change > 0 ? '▲' : '▼'} ${Math.abs(revenueData.percentage)}%
                                        </span>
                                        <span style="color: var(--text-tertiary); font-size: 0.8rem;">vs mes anterior</span>
                                    </div>
                                ` : ''}
                            </div>
                        </div>

                        <div class="stat-card" style="transition: transform 0.2s ease;"
                             onmouseover="this.style.transform='translateY(-5px)'"
                             onmouseout="this.style.transform='translateY(0)'">
                            <div class="stat-icon" style="background: rgba(${cancellationRate.rate > 20 ? '239, 68, 68' : cancellationRate.rate > 10 ? '249, 115, 22' : '34, 197, 94'}, 0.1);">📉</div>
                            <div class="stat-content">
                                <div class="stat-value" style="color: ${cancellationRate.rate > 20 ? '#ef4444' : cancellationRate.rate > 10 ? '#f97316' : '#22c55e'};">${cancellationRate.rate}%</div>
                                <div class="stat-label">Tasa Cancelación</div>
                                <div style="margin-top: 0.5rem; font-size: 0.8rem; color: var(--text-tertiary);">${cancellationRate.cancelled} de ${cancellationRate.total}</div>
                            </div>
                        </div>
                    </div>
                </div>
            `;

        } catch (error) {
            console.error('Error loading dashboard:', error);
            contentArea.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">⚠️</div>
                    <p>Error al cargar los datos del dashboard</p>
                    <p style="font-size: 0.9rem; margin-top: 0.5rem;">Verifica que el servidor esté funcionando</p>
                </div>
            `;
        }
    },

    // Calculate revenue for current and previous month
    calculateRevenue(bookings) {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
        const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

        let thisMonth = 0;
        let prevMonth = 0;

        bookings.forEach(b => {
            if (b.status === 'cancelled' || !b.price) return;
            const d = new Date(b.booking_date);
            const m = d.getMonth();
            const y = d.getFullYear();
            if (m === currentMonth && y === currentYear) thisMonth += parseFloat(b.price);
            if (m === lastMonth && y === lastMonthYear) prevMonth += parseFloat(b.price);
        });

        const change = thisMonth - prevMonth;
        const percentage = prevMonth > 0 ? Math.round((change / prevMonth) * 100) : 0;

        return { thisMonth, prevMonth, change, percentage };
    },

    // Calculate cancellation rate
    calculateCancellationRate(bookings) {
        const total = bookings.length;
        const cancelled = bookings.filter(b => b.status === 'cancelled').length;
        const rate = total > 0 ? Math.round((cancelled / total) * 100) : 0;
        return { total, cancelled, rate };
    },

    // Calculate peak hours
    calculatePeakHours(bookings) {
        const hourCounts = {};
        bookings.forEach(b => {
            if (b.status === 'cancelled') return;
            const hour = parseInt(b.booking_time.substring(0, 2));
            hourCounts[hour] = (hourCounts[hour] || 0) + 1;
        });

        const hours = Object.entries(hourCounts)
            .map(([hour, count]) => ({ hour: parseInt(hour), count }))
            .sort((a, b) => a.hour - b.hour);

        const maxCount = Math.max(...hours.map(h => h.count), 1);
        return { hours, maxCount };
    },

    // Calculate monthly revenue (last 6 months)
    calculateMonthlyRevenue(bookings) {
        const now = new Date();
        const months = [];

        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const m = d.getMonth();
            const y = d.getFullYear();
            const label = d.toLocaleDateString('es-ES', { month: 'short' }).replace('.', '');

            let revenue = 0;
            bookings.forEach(b => {
                if (b.status === 'cancelled' || !b.price) return;
                const bd = new Date(b.booking_date);
                if (bd.getMonth() === m && bd.getFullYear() === y) {
                    revenue += parseFloat(b.price);
                }
            });

            months.push({ label, month: m, year: y, revenue });
        }

        const maxRevenue = Math.max(...months.map(m => m.revenue), 1);
        return { months, maxRevenue };
    },

    // Render peak hours horizontal bar chart
    renderPeakHours(data) {
        if (data.hours.length === 0) {
            return '<p style="color: var(--text-secondary); text-align: center; padding: 2rem;">No hay datos de reservas</p>';
        }

        return `
            <div style="display: flex; flex-direction: column; gap: 0.6rem;">
                ${data.hours.map(h => {
                    const pct = (h.count / data.maxCount) * 100;
                    const isPeak = h.count === data.maxCount;
                    return `
                        <div style="display: flex; align-items: center; gap: 0.75rem;">
                            <span style="min-width: 50px; text-align: right; font-size: 0.85rem; font-weight: 600; color: var(--text-secondary);">
                                ${String(h.hour).padStart(2, '0')}:00
                            </span>
                            <div style="flex: 1; height: 22px; background: var(--bg-tertiary); border-radius: 6px; overflow: hidden; position: relative;">
                                <div style="height: 100%; width: ${pct}%; background: ${isPeak ? 'linear-gradient(90deg, #3b82f6, #8b5cf6)' : 'rgba(59, 130, 246, 0.6)'}; border-radius: 6px; transition: width 0.5s;"></div>
                            </div>
                            <span style="min-width: 30px; font-size: 0.85rem; font-weight: 700; color: ${isPeak ? '#8b5cf6' : 'var(--text-primary)'};">
                                ${h.count}
                            </span>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    },

    // Render monthly revenue vertical bar chart
    renderMonthlyRevenue(data) {
        if (data.months.every(m => m.revenue === 0)) {
            return '<p style="color: var(--text-secondary); text-align: center; padding: 2rem;">No hay datos de ingresos</p>';
        }

        return `
            <div style="display: flex; align-items: flex-end; justify-content: space-around; height: 200px; padding-top: 35px; overflow: visible; position: relative;">
                ${data.months.map(m => {
                    const pct = (m.revenue / data.maxRevenue) * 100;
                    const isCurrentMonth = m.month === new Date().getMonth() && m.year === new Date().getFullYear();
                    return `
                        <div style="display: flex; flex-direction: column; align-items: center; flex: 1; height: 100%;">
                            <div style="flex: 1; display: flex; flex-direction: column; justify-content: flex-end; align-items: center; width: 100%;">
                                <span style="font-size: 0.75rem; font-weight: 700; color: ${isCurrentMonth ? '#10b981' : 'var(--text-secondary)'}; margin-bottom: 4px;">
                                    ${m.revenue > 0 ? m.revenue.toFixed(0) + '€' : ''}
                                </span>
                                <div style="
                                    width: 70%;
                                    max-width: 50px;
                                    height: ${Math.max(pct, 3)}%;
                                    background: ${isCurrentMonth ? 'linear-gradient(180deg, #10b981, #059669)' : 'linear-gradient(180deg, #3b82f6, #2563eb)'};
                                    border-radius: 6px 6px 0 0;
                                    transition: height 0.5s;
                                "></div>
                            </div>
                            <span style="margin-top: 8px; font-size: 0.8rem; font-weight: ${isCurrentMonth ? '700' : '500'}; color: ${isCurrentMonth ? '#10b981' : 'var(--text-secondary)'}; text-transform: capitalize;">
                                ${m.label}
                            </span>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    },

    // Calculate month-over-month comparison
    calculateMonthComparison(bookings) {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        // Calculate last month (handle year boundary)
        const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
        const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

        // Count bookings for this month (excluding cancelled)
        const thisMonthCount = bookings.filter(booking => {
            if (booking.status === 'cancelled') return false;
            const bookingDate = new Date(booking.booking_date);
            return bookingDate.getMonth() === currentMonth &&
                   bookingDate.getFullYear() === currentYear;
        }).length;

        // Count bookings for last month (excluding cancelled)
        const lastMonthCount = bookings.filter(booking => {
            if (booking.status === 'cancelled') return false;
            const bookingDate = new Date(booking.booking_date);
            return bookingDate.getMonth() === lastMonth &&
                   bookingDate.getFullYear() === lastMonthYear;
        }).length;

        // Calculate change
        const change = thisMonthCount - lastMonthCount;

        // Calculate percentage change
        let percentage = 0;
        if (lastMonthCount > 0) {
            percentage = Math.round((change / lastMonthCount) * 100);
        } else if (thisMonthCount > 0) {
            percentage = 100; // If no bookings last month, 100% growth
        }

        return {
            thisMonth: thisMonthCount,
            lastMonth: lastMonthCount,
            change: change,
            percentage: percentage
        };
    },

    // Render month comparison panel
    renderMonthComparison(comparison) {
        const now = new Date();
        const currentMonthName = now.toLocaleDateString('es-ES', { month: 'long' });
        const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastMonthName = lastMonthDate.toLocaleDateString('es-ES', { month: 'long' });

        const isGrowing = comparison.change > 0;
        const isEqual = comparison.change === 0;

        return `
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; align-items: center;">
                <!-- Months Comparison Bars -->
                <div style="display: flex; flex-direction: column; gap: 1.5rem;">
                    <!-- This Month -->
                    <div>
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                            <span style="font-weight: 600; color: var(--text-primary); text-transform: capitalize;">
                                ${currentMonthName}
                            </span>
                            <span style="font-weight: 700; color: var(--primary-color); font-size: 1.25rem;">
                                ${comparison.thisMonth}
                            </span>
                        </div>
                        <div style="background: var(--bg-tertiary); border-radius: 10px; height: 40px; overflow: hidden; position: relative;">
                            <div style="
                                height: 100%;
                                width: ${comparison.thisMonth > 0 ? '100%' : '0%'};
                                background: linear-gradient(90deg, var(--primary-color), var(--secondary-color));
                                border-radius: 10px;
                                transition: width 1s ease;
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                color: white;
                                font-weight: 600;
                            ">
                                ${comparison.thisMonth > 0 ? 'Mes Actual' : ''}
                            </div>
                        </div>
                    </div>

                    <!-- Last Month -->
                    <div>
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                            <span style="font-weight: 600; color: var(--text-secondary); text-transform: capitalize;">
                                ${lastMonthName}
                            </span>
                            <span style="font-weight: 700; color: var(--text-secondary); font-size: 1.25rem;">
                                ${comparison.lastMonth}
                            </span>
                        </div>
                        <div style="background: var(--bg-tertiary); border-radius: 10px; height: 40px; overflow: hidden; position: relative;">
                            <div style="
                                height: 100%;
                                width: ${comparison.lastMonth > 0 && comparison.thisMonth > 0 ? (comparison.lastMonth / comparison.thisMonth * 100) + '%' : comparison.lastMonth > 0 ? '100%' : '0%'};
                                background: linear-gradient(90deg, rgba(107, 114, 128, 0.6), rgba(107, 114, 128, 0.4));
                                border-radius: 10px;
                                transition: width 1s ease;
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                color: white;
                                font-weight: 600;
                            ">
                                ${comparison.lastMonth > 0 ? 'Mes Anterior' : ''}
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Change Indicator -->
                <div style="text-align: center; padding: 2rem; background: ${isGrowing ? 'rgba(34, 197, 94, 0.1)' : isEqual ? 'rgba(107, 114, 128, 0.1)' : 'rgba(239, 68, 68, 0.1)'}; border-radius: 15px; border: 2px solid ${isGrowing ? 'rgba(34, 197, 94, 0.3)' : isEqual ? 'rgba(107, 114, 128, 0.3)' : 'rgba(239, 68, 68, 0.3)'};">
                    <div style="font-size: 4rem; margin-bottom: 0.5rem;">
                        ${isGrowing ? '📈' : isEqual ? '➡️' : '📉'}
                    </div>
                    <div style="font-size: 3rem; font-weight: 700; color: ${isGrowing ? '#22c55e' : isEqual ? '#6b7280' : '#ef4444'}; margin-bottom: 0.5rem;">
                        ${isGrowing ? '+' : ''}${comparison.change}
                    </div>
                    <div style="font-size: 1.5rem; font-weight: 700; color: ${isGrowing ? '#22c55e' : isEqual ? '#6b7280' : '#ef4444'}; margin-bottom: 0.5rem;">
                        ${isEqual ? '0' : (isGrowing ? '+' : '')}${comparison.percentage}%
                    </div>
                    <div style="font-size: 1rem; color: var(--text-secondary); font-weight: 600;">
                        ${isGrowing ? '¡Crecimiento!' : isEqual ? 'Sin cambios' : 'Decrecimiento'}
                    </div>
                    <div style="font-size: 0.85rem; color: var(--text-tertiary); margin-top: 0.5rem;">
                        vs ${lastMonthName}
                    </div>
                </div>
            </div>

            ${comparison.thisMonth === 0 && comparison.lastMonth === 0 ? `
                <div style="margin-top: 1.5rem; padding: 1rem; background: rgba(234, 179, 8, 0.1); border-radius: 10px; text-align: center; color: var(--text-secondary);">
                    💡 Todavía no hay suficientes datos para comparar. ¡Sigue trabajando!
                </div>
            ` : ''}
        `;
    },

    // Process booking data for trend chart (last 7 weeks)
    processTrendData(bookings) {
        const weeks = [];
        const now = new Date();

        // Generate last 7 weeks
        for (let i = 6; i >= 0; i--) {
            const weekEnd = new Date(now);
            weekEnd.setDate(now.getDate() - (i * 7));
            const weekStart = new Date(weekEnd);
            weekStart.setDate(weekEnd.getDate() - 6);

            const weekLabel = i === 0
                ? 'Esta semana'
                : `${weekStart.getDate()}/${weekStart.getMonth() + 1} - ${weekEnd.getDate()}/${weekEnd.getMonth() + 1}`;

            weeks.push({
                label: weekLabel,
                start: weekStart,
                end: weekEnd,
                count: 0
            });
        }

        // Count bookings per week (excluding cancelled)
        bookings.forEach(booking => {
            if (booking.status === 'cancelled') return;

            const bookingDate = new Date(booking.booking_date);
            weeks.forEach(week => {
                if (bookingDate >= week.start && bookingDate <= week.end) {
                    week.count++;
                }
            });
        });

        return weeks;
    },

    // Render trend chart
    renderTrendChart(trendData) {
        const maxCount = Math.max(...trendData.map(w => w.count), 1);

        return `
            <div style="padding: 1rem;">
                <!-- Chart Bars -->
                <div style="display: flex; align-items: stretch; justify-content: space-between; gap: 0.5rem; height: 220px; padding-top: 35px; margin-bottom: 1rem; overflow: visible;">
                    ${trendData.map((week, index) => {
                        const height = maxCount > 0 ? (week.count / maxCount) * 100 : 0;
                        const isCurrentWeek = index === trendData.length - 1;

                        return `
                            <div style="flex: 1; display: flex; flex-direction: column; align-items: center; overflow: visible;">
                                <!-- Bar -->
                                <div style="width: 100%; display: flex; flex-direction: column; justify-content: flex-end; height: 100%; overflow: visible;">
                                    ${week.count > 0 ? `
                                        <div style="
                                            width: 100%;
                                            height: ${height}%;
                                            min-height: 8px;
                                            background: ${isCurrentWeek ? 'linear-gradient(180deg, var(--primary-color), var(--secondary-color))' : 'linear-gradient(180deg, rgba(59, 130, 246, 0.8), rgba(59, 130, 246, 0.5))'};
                                            border-radius: 8px 8px 0 0;
                                            transition: all 0.3s ease;
                                            position: relative;
                                            cursor: pointer;
                                            overflow: visible;
                                            box-shadow: 0 -2px 8px rgba(59, 130, 246, 0.3);
                                        "
                                        onmouseover="this.style.transform='scaleY(1.05)'; this.style.boxShadow='0 -4px 12px rgba(59, 130, 246, 0.5)'"
                                        onmouseout="this.style.transform='scaleY(1)'; this.style.boxShadow='0 -2px 8px rgba(59, 130, 246, 0.3)'">
                                            <div style="
                                                position: absolute;
                                                top: -30px;
                                                left: 50%;
                                                transform: translateX(-50%);
                                                background: var(--bg-tertiary);
                                                color: var(--text-primary);
                                                padding: 0.25rem 0.5rem;
                                                border-radius: 6px;
                                                font-weight: 700;
                                                font-size: 0.9rem;
                                                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
                                                white-space: nowrap;
                                            ">
                                                ${week.count}
                                            </div>
                                        </div>
                                    ` : `
                                        <div style="
                                            width: 100%;
                                            height: 5px;
                                            background: var(--border-color);
                                            border-radius: 4px;
                                        "></div>
                                    `}
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>

                <!-- Chart Labels -->
                <div style="display: flex; justify-content: space-between; gap: 0.5rem;">
                    ${trendData.map((week, index) => {
                        const isCurrentWeek = index === trendData.length - 1;
                        return `
                            <div style="flex: 1; text-align: center; font-size: 0.75rem; color: ${isCurrentWeek ? 'var(--primary-color)' : 'var(--text-secondary)'}; font-weight: ${isCurrentWeek ? '700' : '500'}; line-height: 1.2;">
                                ${week.label}
                            </div>
                        `;
                    }).join('')}
                </div>

                <!-- Summary Stats -->
                <div style="margin-top: 1.5rem; padding-top: 1.5rem; border-top: 1px solid var(--border-color); display: flex; justify-content: space-around; flex-wrap: wrap; gap: 1rem;">
                    <div style="text-align: center;">
                        <div style="font-size: 1.75rem; font-weight: 700; color: var(--primary-color);">
                            ${trendData[trendData.length - 1].count}
                        </div>
                        <div style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 0.25rem;">
                            Esta semana
                        </div>
                    </div>
                    <div style="text-align: center;">
                        <div style="font-size: 1.75rem; font-weight: 700; color: var(--text-primary);">
                            ${Math.round(trendData.reduce((sum, w) => sum + w.count, 0) / trendData.length)}
                        </div>
                        <div style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 0.25rem;">
                            Promedio semanal
                        </div>
                    </div>
                    <div style="text-align: center;">
                        <div style="font-size: 1.75rem; font-weight: 700; color: var(--secondary-color);">
                            ${Math.max(...trendData.map(w => w.count))}
                        </div>
                        <div style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 0.25rem;">
                            Semana pico
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    // Render a single today booking card
    renderTodayBooking(booking) {
        const now = new Date();
        const bookingDateTime = new Date(`${booking.booking_date}T${booking.booking_time}`);
        const hoursUntil = (bookingDateTime - now) / (1000 * 60 * 60);
        const isUpcoming = hoursUntil > 0 && hoursUntil <= 2; // Next 2 hours
        const isPast = hoursUntil < 0;

        return `
            <div style="background: ${isPast ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.15)'}; backdrop-filter: blur(10px); border-radius: 12px; padding: 1.25rem; border-left: 4px solid ${isUpcoming ? '#fbbf24' : isPast ? '#6b7280' : '#ffffff'}; transition: all 0.3s ease; ${isPast ? 'opacity: 0.7;' : ''}"
                 onmouseover="this.style.transform='translateX(5px)'; this.style.background='rgba(255, 255, 255, 0.25)'"
                 onmouseout="this.style.transform='translateX(0)'; this.style.background='${isPast ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.15)'}'">
                <div style="display: flex; justify-content: space-between; align-items: start; gap: 1rem; flex-wrap: wrap;">
                    <!-- Time & Status -->
                    <div style="display: flex; align-items: center; gap: 1rem;">
                        <div style="background: ${isUpcoming ? 'rgba(251, 191, 36, 0.2)' : isPast ? 'rgba(107, 114, 128, 0.2)' : 'rgba(255, 255, 255, 0.2)'}; padding: 0.75rem; border-radius: 10px; min-width: 80px; text-align: center;">
                            <div style="color: white; font-size: 1.75rem; font-weight: 700; line-height: 1;">
                                ${booking.booking_time.substring(0, 5)}
                            </div>
                            ${isUpcoming ? `
                                <div style="color: #fbbf24; font-size: 0.7rem; font-weight: 600; margin-top: 0.25rem;">
                                    ¡PRÓXIMA!
                                </div>
                            ` : isPast ? `
                                <div style="color: #9ca3af; font-size: 0.7rem; font-weight: 600; margin-top: 0.25rem;">
                                    PASADA
                                </div>
                            ` : ''}
                        </div>

                        <!-- Customer Info -->
                        <div>
                            <div style="color: white; font-weight: 700; font-size: 1.1rem; margin-bottom: 0.25rem;">
                                ${booking.customer_name}
                            </div>
                            <div style="color: rgba(255, 255, 255, 0.8); font-size: 0.9rem;">
                                ${booking.service_name || 'Sin servicio especificado'}
                            </div>
                            <div style="color: rgba(255, 255, 255, 0.6); font-size: 0.85rem; margin-top: 0.25rem;">
                                📧 ${booking.customer_email} • 📞 ${booking.customer_phone}
                            </div>
                        </div>
                    </div>

                    <!-- Status Badge -->
                    <div>
                        <span style="display: inline-block; padding: 0.5rem 1rem; border-radius: 8px; font-weight: 600; font-size: 0.9rem; background: ${this.getStatusColor(booking.status)}; color: white;">
                            ${this.getStatusLabel(booking.status)}
                        </span>
                    </div>
                </div>

                ${booking.notes ? `
                    <div style="margin-top: 0.75rem; padding-top: 0.75rem; border-top: 1px solid rgba(255, 255, 255, 0.2); color: rgba(255, 255, 255, 0.8); font-size: 0.9rem;">
                        <strong>Notas:</strong> ${booking.notes}
                    </div>
                ` : ''}
            </div>
        `;
    },

    // Helper function to get status color
    getStatusColor(status) {
        const colors = {
            'pending': 'rgba(234, 179, 8, 0.9)',
            'confirmed': 'rgba(34, 197, 94, 0.9)',
            'cancelled': 'rgba(239, 68, 68, 0.9)',
            'completed': 'rgba(59, 130, 246, 0.9)'
        };
        return colors[status] || 'rgba(107, 114, 128, 0.9)';
    },

    // Helper function to get status label in Spanish
    getStatusLabel(status) {
        const labels = {
            'pending': 'Pendiente',
            'confirmed': 'Confirmada',
            'cancelled': 'Cancelada',
            'completed': 'Completada'
        };
        return labels[status] || status;
    },

    // Open modal to show bookings filtered by type
    async openBookingsModal(type) {
        try {
            const businessId = auth.getBusinessId();

            // Get all bookings
            const response = await api.fetch(`/api/bookings/${businessId}`);

            if (!response.success) {
                throw new Error(response.message || 'Error al cargar reservas');
            }

            const allBookings = response.data || [];

            // Calculate date range (today + 7 days)
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const sevenDaysLater = new Date(today);
            sevenDaysLater.setDate(today.getDate() + 7);

            // Filter bookings based on type
            let filteredBookings = [];
            let title = '';
            let icon = '';
            let color = '';

            switch(type) {
                case 'all':
                    filteredBookings = allBookings.filter(b => {
                        const bookingDate = new Date(b.booking_date);
                        return bookingDate >= today && bookingDate <= sevenDaysLater;
                    });
                    title = 'Todas las Reservas';
                    icon = '📊';
                    color = '#3b82f6';
                    break;

                case 'month':
                    const currentMonth = today.getMonth();
                    const currentYear = today.getFullYear();
                    filteredBookings = allBookings.filter(b => {
                        const bookingDate = new Date(b.booking_date);
                        return bookingDate >= today &&
                               bookingDate <= sevenDaysLater &&
                               bookingDate.getMonth() === currentMonth &&
                               bookingDate.getFullYear() === currentYear;
                    });
                    title = 'Reservas de Este Mes';
                    icon = '📅';
                    color = '#22c55e';
                    break;

                case 'pending':
                    filteredBookings = allBookings.filter(b => {
                        const bookingDate = new Date(b.booking_date);
                        return b.status === 'pending' &&
                               bookingDate >= today &&
                               bookingDate <= sevenDaysLater;
                    });
                    title = 'Reservas Pendientes';
                    icon = '⏳';
                    color = '#eab308';
                    break;

                case 'confirmed':
                    filteredBookings = allBookings.filter(b => {
                        const bookingDate = new Date(b.booking_date);
                        return b.status === 'confirmed' &&
                               bookingDate >= today &&
                               bookingDate <= sevenDaysLater;
                    });
                    title = 'Reservas Confirmadas';
                    icon = '✅';
                    color = '#22c55e';
                    break;

                case 'cancelled':
                    filteredBookings = allBookings.filter(b => {
                        const bookingDate = new Date(b.booking_date);
                        return b.status === 'cancelled' &&
                               bookingDate >= today &&
                               bookingDate <= sevenDaysLater;
                    });
                    title = 'Reservas Canceladas';
                    icon = '❌';
                    color = '#ef4444';
                    break;
            }

            // Sort by date and time
            filteredBookings.sort((a, b) => {
                const dateCompare = a.booking_date.localeCompare(b.booking_date);
                if (dateCompare !== 0) return dateCompare;
                return a.booking_time.localeCompare(b.booking_time);
            });

            // Create modal
            const overlay = document.createElement('div');
            overlay.className = 'modal-overlay';
            overlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.7);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10000;
                animation: fadeIn 0.2s ease;
            `;

            const modal = document.createElement('div');
            modal.style.cssText = `
                background: var(--bg-secondary);
                border-radius: 16px;
                max-width: 900px;
                width: 90%;
                max-height: 85vh;
                overflow: hidden;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
                animation: slideUp 0.3s ease;
            `;

            const header = document.createElement('div');
            header.style.cssText = `
                padding: 1.5rem;
                border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                display: flex;
                justify-content: space-between;
                align-items: center;
                background: linear-gradient(135deg, ${color}15, ${color}05);
            `;

            header.innerHTML = `
                <div>
                    <h2 style="margin: 0; font-size: 1.5rem; color: var(--text-primary); display: flex; align-items: center; gap: 0.5rem;">
                        ${icon} ${title}
                    </h2>
                    <p style="margin: 0.5rem 0 0 0; color: var(--text-secondary); font-size: 0.9rem;">
                        Próximos 7 días · ${filteredBookings.length} reservas
                    </p>
                </div>
                <button id="close-modal" style="background: none; border: none; font-size: 1.5rem; cursor: pointer; color: var(--text-secondary); padding: 0.5rem;">
                    ✕
                </button>
            `;

            const content = document.createElement('div');
            content.style.cssText = `
                padding: 1.5rem;
                overflow-y: auto;
                max-height: calc(85vh - 140px);
            `;

            if (filteredBookings.length === 0) {
                content.innerHTML = `
                    <div style="text-align: center; padding: 3rem; color: var(--text-secondary);">
                        <div style="font-size: 3rem; margin-bottom: 1rem;">${icon}</div>
                        <p style="font-size: 1.1rem; margin: 0;">No hay reservas para mostrar</p>
                        <p style="font-size: 0.9rem; margin-top: 0.5rem; color: var(--text-tertiary);">
                            (próximos 7 días)
                        </p>
                    </div>
                `;
            } else {
                const bookingsList = filteredBookings.map(booking => {
                    const bookingDate = new Date(booking.booking_date);
                    const isToday = bookingDate.toDateString() === today.toDateString();

                    return `
                        <div style="
                            background: var(--bg-tertiary);
                            border-left: 4px solid ${color};
                            padding: 1.25rem;
                            border-radius: 8px;
                            margin-bottom: 1rem;
                            transition: all 0.2s ease;
                        "
                        onmouseover="this.style.transform='translateX(5px)'; this.style.boxShadow='0 4px 12px rgba(0,0,0,0.15)'"
                        onmouseout="this.style.transform='translateX(0)'; this.style.boxShadow='none'">
                            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 0.75rem; flex-wrap: wrap; gap: 1rem;">
                                <div style="flex: 1;">
                                    <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.5rem;">
                                        ${isToday ? '<span style="background: #ef4444; color: white; padding: 0.25rem 0.5rem; border-radius: 6px; font-size: 0.75rem; font-weight: 600;">HOY</span>' : ''}
                                        <h3 style="margin: 0; font-size: 1.1rem; color: var(--text-primary);">
                                            ${booking.customer_name}
                                        </h3>
                                    </div>
                                    <div style="color: var(--text-secondary); font-size: 0.9rem; display: flex; flex-direction: column; gap: 0.25rem;">
                                        <div>📧 ${booking.customer_email}</div>
                                        ${booking.customer_phone ? `<div>📱 ${booking.customer_phone}</div>` : ''}
                                    </div>
                                </div>
                                <div style="text-align: right;">
                                    <span class="status-badge status-${booking.status}" style="display: inline-block; padding: 0.5rem 1rem; border-radius: 8px; font-weight: 600; font-size: 0.85rem;">
                                        ${this.getStatusLabel(booking.status)}
                                    </span>
                                </div>
                            </div>

                            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 0.75rem; margin-top: 0.75rem; padding-top: 0.75rem; border-top: 1px solid rgba(255,255,255,0.1);">
                                <div>
                                    <div style="color: var(--text-tertiary); font-size: 0.8rem; margin-bottom: 0.25rem;">Servicio</div>
                                    <div style="color: var(--text-primary); font-weight: 500;">${booking.service_name || 'N/A'}</div>
                                </div>
                                <div>
                                    <div style="color: var(--text-tertiary); font-size: 0.8rem; margin-bottom: 0.25rem;">Fecha</div>
                                    <div style="color: var(--text-primary); font-weight: 500;">
                                        📅 ${bookingDate.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })}
                                    </div>
                                </div>
                                <div>
                                    <div style="color: var(--text-tertiary); font-size: 0.8rem; margin-bottom: 0.25rem;">Hora</div>
                                    <div style="color: var(--text-primary); font-weight: 500;">
                                        🕐 ${booking.booking_time.substring(0, 5)}
                                    </div>
                                </div>
                            </div>

                            ${booking.notes ? `
                                <div style="margin-top: 0.75rem; padding-top: 0.75rem; border-top: 1px solid rgba(255,255,255,0.1);">
                                    <div style="color: var(--text-tertiary); font-size: 0.8rem; margin-bottom: 0.25rem;">📝 Notas</div>
                                    <div style="color: var(--text-secondary); font-style: italic; font-size: 0.9rem;">
                                        "${booking.notes}"
                                    </div>
                                </div>
                            ` : ''}

                            <!-- WhatsApp Button -->
                            ${booking.whatsapp_consent && this.businessSettings.whatsappEnabled && this.businessSettings.whatsappNumber ? `
                                <div style="margin-top: 1rem; padding-top: 0.75rem; border-top: 1px solid rgba(255,255,255,0.1);">
                                    <button
                                        onclick="dashboard.sendWhatsApp(${booking.id})"
                                        style="
                                            background: linear-gradient(135deg, #25D366, #128C7E);
                                            color: white;
                                            border: none;
                                            padding: 0.75rem 1.25rem;
                                            border-radius: 8px;
                                            font-weight: 600;
                                            font-size: 0.9rem;
                                            cursor: pointer;
                                            display: inline-flex;
                                            align-items: center;
                                            gap: 0.5rem;
                                            transition: all 0.2s ease;
                                        "
                                        onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 12px rgba(37, 211, 102, 0.4)'"
                                        onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none'">
                                        💬 Enviar WhatsApp
                                    </button>
                                </div>
                            ` : booking.whatsapp_consent && !this.businessSettings.whatsappEnabled ? `
                                <div style="margin-top: 1rem; padding-top: 0.75rem; border-top: 1px solid rgba(255,255,255,0.1);">
                                    <button
                                        disabled
                                        title="Configura WhatsApp en Ajustes → Notificaciones"
                                        style="
                                            background: #6b7280;
                                            color: #9ca3af;
                                            border: none;
                                            padding: 0.75rem 1.25rem;
                                            border-radius: 8px;
                                            font-weight: 600;
                                            font-size: 0.9rem;
                                            cursor: not-allowed;
                                            display: inline-flex;
                                            align-items: center;
                                            gap: 0.5rem;
                                        ">
                                        💬 WhatsApp (no configurado)
                                    </button>
                                </div>
                            ` : !booking.whatsapp_consent && booking.customer_phone ? `
                                <div style="margin-top: 1rem; padding-top: 0.75rem; border-top: 1px solid rgba(255,255,255,0.1);">
                                    <span style="font-size: 0.85rem; color: var(--text-tertiary); font-style: italic;">
                                        Cliente no autorizó contacto por WhatsApp
                                    </span>
                                </div>
                            ` : ''}
                        </div>
                    `;
                }).join('');

                content.innerHTML = bookingsList;
            }

            const footer = document.createElement('div');
            footer.style.cssText = `
                padding: 1rem 1.5rem;
                border-top: 1px solid rgba(255, 255, 255, 0.1);
                display: flex;
                justify-content: flex-end;
                align-items: center;
            `;

            footer.innerHTML = `
                <button id="close-modal-btn" style="
                    padding: 0.75rem 1.5rem;
                    background: rgba(255, 255, 255, 0.1);
                    color: var(--text-primary);
                    border: none;
                    border-radius: 8px;
                    cursor: pointer;
                    font-weight: 600;
                    transition: all 0.2s ease;
                "
                onmouseover="this.style.background='rgba(255, 255, 255, 0.2)'"
                onmouseout="this.style.background='rgba(255, 255, 255, 0.1)'">
                    Cerrar
                </button>
            `;

            modal.appendChild(header);
            modal.appendChild(content);
            modal.appendChild(footer);
            overlay.appendChild(modal);
            document.body.appendChild(overlay);

            // Event listeners
            const closeModal = () => {
                overlay.style.animation = 'fadeOut 0.2s ease';
                setTimeout(() => {
                    document.body.removeChild(overlay);
                }, 200);
            };

            document.getElementById('close-modal').addEventListener('click', closeModal);
            document.getElementById('close-modal-btn').addEventListener('click', closeModal);
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) closeModal();
            });

        } catch (error) {
            console.error('Error loading bookings:', error);
            this.showNotification('Error al cargar reservas', 'error');
        }
    },

    // Open modal to show cancelled future bookings
    async openCancelledModal() {
        try {
            const businessId = auth.getBusinessId();
            const response = await api.fetch(`/api/bookings/${businessId}/cancelled-future`);

            if (!response.success) {
                throw new Error(response.message || 'Error al cargar reservas canceladas');
            }

            const cancelledBookings = response.data || [];

            // Create modal overlay
            const overlay = document.createElement('div');
            overlay.className = 'modal-overlay';
            overlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.7);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10000;
                animation: fadeIn 0.2s ease;
            `;

            const modal = document.createElement('div');
            modal.style.cssText = `
                background: var(--bg-secondary);
                border-radius: 16px;
                max-width: 800px;
                width: 90%;
                max-height: 80vh;
                overflow: hidden;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
                animation: slideUp 0.3s ease;
            `;

            const header = document.createElement('div');
            header.style.cssText = `
                padding: 1.5rem;
                border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                display: flex;
                justify-content: space-between;
                align-items: center;
            `;

            const newCount = cancelledBookings.filter(b => !b.viewed_by_admin).length;

            header.innerHTML = `
                <div>
                    <h2 style="margin: 0; font-size: 1.5rem; color: var(--text-primary);">
                        ❌ Reservas Canceladas (Futuras)
                    </h2>
                    <p style="margin: 0.5rem 0 0 0; color: var(--text-secondary); font-size: 0.9rem;">
                        ${cancelledBookings.length} canceladas
                        ${newCount > 0 ? `· <span style="color: #ef4444; font-weight: 600;">${newCount} nuevas</span>` : ''}
                    </p>
                </div>
                <button id="close-cancelled-modal" style="background: none; border: none; font-size: 1.5rem; cursor: pointer; color: var(--text-secondary); padding: 0.5rem;">
                    ✕
                </button>
            `;

            const content = document.createElement('div');
            content.style.cssText = `
                padding: 1.5rem;
                overflow-y: auto;
                max-height: calc(80vh - 180px);
            `;

            if (cancelledBookings.length === 0) {
                content.innerHTML = `
                    <div style="text-align: center; padding: 3rem; color: var(--text-secondary);">
                        <div style="font-size: 3rem; margin-bottom: 1rem;">✅</div>
                        <p style="font-size: 1.1rem; margin: 0;">No hay reservas canceladas futuras</p>
                    </div>
                `;
            } else {
                const bookingsList = cancelledBookings.map(booking => {
                    const isNew = !booking.viewed_by_admin;
                    const cancelDate = new Date(booking.cancellation_date);
                    const bookingDate = new Date(booking.booking_date);

                    return `
                        <div style="
                            background: ${isNew ? 'rgba(239, 68, 68, 0.1)' : 'rgba(255, 255, 255, 0.05)'};
                            border-left: 4px solid ${isNew ? '#ef4444' : 'rgba(255, 255, 255, 0.2)'};
                            padding: 1rem;
                            border-radius: 8px;
                            margin-bottom: 1rem;
                        ">
                            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 0.75rem;">
                                <div style="flex: 1;">
                                    <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;">
                                        <span style="font-size: 1.2rem;">${isNew ? '🔴' : '⚪'}</span>
                                        <h3 style="margin: 0; font-size: 1.1rem; color: var(--text-primary);">
                                            ${booking.customer_name}
                                        </h3>
                                    </div>
                                    <div style="color: var(--text-secondary); font-size: 0.9rem;">
                                        📧 ${booking.customer_email}
                                        ${booking.customer_phone ? ` · 📱 ${booking.customer_phone}` : ''}
                                    </div>
                                </div>
                            </div>

                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; margin-bottom: 0.75rem;">
                                <div>
                                    <div style="color: var(--text-tertiary); font-size: 0.8rem; margin-bottom: 0.25rem;">Servicio</div>
                                    <div style="color: var(--text-primary); font-weight: 500;">${booking.service_name || 'N/A'}</div>
                                </div>
                                <div>
                                    <div style="color: var(--text-tertiary); font-size: 0.8rem; margin-bottom: 0.25rem;">Reserva era para</div>
                                    <div style="color: var(--text-primary); font-weight: 500;">
                                        📅 ${bookingDate.toLocaleDateString('es-ES')} · 🕐 ${booking.booking_time}
                                    </div>
                                </div>
                            </div>

                            <div style="background: rgba(0, 0, 0, 0.2); padding: 0.75rem; border-radius: 6px; margin-bottom: 0.5rem;">
                                <div style="color: var(--text-tertiary); font-size: 0.8rem; margin-bottom: 0.25rem;">Cancelada el</div>
                                <div style="color: #ef4444; font-weight: 600;">
                                    ${cancelDate.toLocaleDateString('es-ES')} a las ${cancelDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                                </div>
                            </div>

                            ${booking.cancellation_reason ? `
                                <div style="background: rgba(59, 130, 246, 0.1); border-left: 3px solid #3b82f6; padding: 0.75rem; border-radius: 6px;">
                                    <div style="color: var(--text-tertiary); font-size: 0.8rem; margin-bottom: 0.25rem;">💬 Motivo de cancelación</div>
                                    <div style="color: var(--text-primary); font-style: italic;">
                                        "${booking.cancellation_reason}"
                                    </div>
                                </div>
                            ` : ''}
                        </div>
                    `;
                }).join('');

                content.innerHTML = bookingsList;
            }

            const footer = document.createElement('div');
            footer.style.cssText = `
                padding: 1rem 1.5rem;
                border-top: 1px solid rgba(255, 255, 255, 0.1);
                display: flex;
                justify-content: space-between;
                align-items: center;
            `;

            const unviewedIds = cancelledBookings.filter(b => !b.viewed_by_admin).map(b => b.id);

            footer.innerHTML = `
                <button id="mark-all-viewed" ${unviewedIds.length === 0 ? 'disabled' : ''} style="
                    padding: 0.75rem 1.5rem;
                    background: ${unviewedIds.length > 0 ? '#3b82f6' : 'rgba(255, 255, 255, 0.1)'};
                    color: white;
                    border: none;
                    border-radius: 8px;
                    cursor: ${unviewedIds.length > 0 ? 'pointer' : 'not-allowed'};
                    font-weight: 600;
                    transition: all 0.2s ease;
                ">
                    ✓ Marcar todas como vistas
                </button>
                <button id="close-modal-btn" style="
                    padding: 0.75rem 1.5rem;
                    background: rgba(255, 255, 255, 0.1);
                    color: var(--text-primary);
                    border: none;
                    border-radius: 8px;
                    cursor: pointer;
                    font-weight: 600;
                    transition: all 0.2s ease;
                ">
                    Cerrar
                </button>
            `;

            modal.appendChild(header);
            modal.appendChild(content);
            modal.appendChild(footer);
            overlay.appendChild(modal);
            document.body.appendChild(overlay);

            // Event listeners
            const closeModal = () => {
                overlay.style.animation = 'fadeOut 0.2s ease';
                setTimeout(() => {
                    document.body.removeChild(overlay);
                    this.load(); // Refresh stats
                }, 200);
            };

            document.getElementById('close-cancelled-modal').addEventListener('click', closeModal);
            document.getElementById('close-modal-btn').addEventListener('click', closeModal);
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) closeModal();
            });

            // Mark all as viewed
            if (unviewedIds.length > 0) {
                document.getElementById('mark-all-viewed').addEventListener('click', async () => {
                    try {
                        const response = await api.fetch('/api/bookings/mark-viewed', {
                            method: 'PATCH',
                            body: JSON.stringify({ bookingIds: unviewedIds })
                        });

                        if (response.success) {
                            closeModal();
                            this.showNotification('Reservas marcadas como vistas', 'success');
                        }
                    } catch (error) {
                        console.error('Error marking as viewed:', error);
                        this.showNotification('Error al marcar como vistas', 'error');
                    }
                });
            }

        } catch (error) {
            console.error('Error loading cancelled bookings:', error);
            this.showNotification('Error al cargar reservas canceladas', 'error');
        }
    },

    // Send WhatsApp message to customer
    async sendWhatsApp(bookingId) {
        try {
            // Obtener detalles de la reserva
            const businessId = auth.getBusinessId();
            const response = await api.fetch(`/api/bookings/${businessId}`);

            if (!response.success) {
                alert('Error al cargar los detalles de la reserva');
                return;
            }

            const booking = response.data.find(b => b.id === bookingId);

            if (!booking) {
                alert('No se encontró la reserva');
                return;
            }

            if (!booking.whatsapp_consent) {
                alert('Este cliente no autorizó contacto por WhatsApp');
                return;
            }

            if (!this.businessSettings.whatsappEnabled || !this.businessSettings.whatsappNumber) {
                alert('WhatsApp no está configurado. Ve a Configuración → Notificaciones para activarlo.');
                return;
            }

            if (!booking.customer_phone) {
                alert('Este cliente no proporcionó número de teléfono');
                return;
            }

            // Formatear fecha y hora
            const date = new Date(booking.booking_date);
            const formattedDate = date.toLocaleDateString('es-ES', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
            const formattedTime = booking.booking_time.substring(0, 5);

            // Reemplazar variables en la plantilla
            let message = this.businessSettings.whatsappTemplate
                .replace(/{nombre}/g, booking.customer_name)
                .replace(/{fecha}/g, formattedDate)
                .replace(/{hora}/g, formattedTime)
                .replace(/{servicio}/g, booking.service_name || 'Reserva')
                .replace(/{negocio}/g, this.businessSettings.businessName)
                .replace(/{nombre_negocio}/g, this.businessSettings.businessName);

            // Limpiar número de teléfono (eliminar espacios, guiones, etc.)
            let phoneNumber = booking.customer_phone.replace(/\D/g, '');

            // Si el número no tiene prefijo internacional, añadir el de España (34)
            // Números españoles: empiezan con 6, 7, 8 o 9 y tienen 9 dígitos
            if (phoneNumber.length === 9 && /^[6789]/.test(phoneNumber)) {
                phoneNumber = '34' + phoneNumber;
                console.log('📱 Número sin prefijo detectado, añadiendo +34:', phoneNumber);
            }

            // Construir URL de WhatsApp
            const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;

            // Abrir WhatsApp en nueva ventana
            window.open(whatsappUrl, '_blank');

        } catch (error) {
            console.error('Error sending WhatsApp:', error);
            alert('Error al preparar mensaje de WhatsApp');
        }
    },

    // === ACTION BOXES ===

    renderActionBoxes(todayBookings) {
        const tomorrow  = this.tomorrowBookings || [];
        const feedback  = this.feedbackPending  || [];
        const cancelled = this.cancelledFuture  || [];

        const boxes = [
            { id: 'hoy',        icon: '📅', title: 'Reservas Hoy',       count: todayBookings.length, color: '#3b82f6' },
            { id: 'manana',     icon: '⏰', title: 'Recordatorio 24h',    count: tomorrow.length,      color: '#8b5cf6' },
            { id: 'feedback',   icon: '⭐', title: 'Feedback post-cita',  count: feedback.length,      color: '#f59e0b' },
            { id: 'canceladas', icon: '❌', title: 'Canceladas (7 días)', count: cancelled.length,     color: '#ef4444' }
        ];

        return `
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.25rem; margin-bottom: 2rem;">
                ${boxes.map(box => `
                    <div onclick="dashboard.openActionBoxModal('${box.id}')"
                         style="background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 14px; padding: 1.5rem; box-shadow: 0 4px 12px rgba(0,0,0,0.1); cursor: pointer; transition: all 0.2s ease;"
                         onmouseover="this.style.transform='translateY(-4px)'; this.style.boxShadow='0 8px 24px rgba(0,0,0,0.18)'; this.style.borderColor='${box.color}50'"
                         onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 12px rgba(0,0,0,0.1)'; this.style.borderColor='var(--border-color)'">
                        <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1rem;">
                            <div style="width: 44px; height: 44px; border-radius: 10px; background: ${box.color}20; display: flex; align-items: center; justify-content: center; font-size: 1.3rem; flex-shrink: 0;">
                                ${box.icon}
                            </div>
                            <div style="font-weight: 600; color: var(--text-secondary); font-size: 0.9rem; line-height: 1.3;">${box.title}</div>
                        </div>
                        <div id="dash-count-${box.id}" style="font-size: 2.75rem; font-weight: 700; color: ${box.color}; line-height: 1;">${box.count}</div>
                        <div style="margin-top: 0.6rem; font-size: 0.8rem; color: var(--text-secondary);">Ver detalle →</div>
                    </div>
                `).join('')}
            </div>
        `;
    },

    renderActionBoxHoy(bookings) {
        if (bookings.length === 0) {
            return '<div style="padding: 1.25rem; text-align: center; color: var(--text-secondary); font-size: 0.9rem;">No hay reservas hoy</div>';
        }
        return `<div style="padding: 0.5rem 0.75rem;">
            ${bookings.map(b => `
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.6rem 0.25rem; border-bottom: 1px solid var(--border-color);">
                    <div>
                        <div style="font-weight: 600; color: var(--text-primary); font-size: 0.9rem;">${b.customer_name}</div>
                        <div style="font-size: 0.8rem; color: var(--text-secondary);">${b.booking_time.substring(0,5)} · ${b.service_name || 'Sin servicio'}</div>
                    </div>
                    <span class="status-badge status-${b.status}" style="font-size: 0.75rem; padding: 0.2rem 0.55rem;">${this.getStatusLabel(b.status)}</span>
                </div>
            `).join('')}
        </div>`;
    },

    renderActionBoxManana(bookings) {
        if (bookings.length === 0) {
            return '<div style="padding: 1.25rem; text-align: center; color: var(--text-secondary); font-size: 0.9rem;">Sin reservas para mañana</div>';
        }
        return `<div style="padding: 0.5rem 0.75rem;">
            ${bookings.map(b => `
                <div style="display: flex; justify-content: space-between; align-items: center; gap: 0.5rem; padding: 0.6rem 0.25rem; border-bottom: 1px solid var(--border-color);">
                    <div style="flex: 1; min-width: 0;">
                        <div style="font-weight: 600; color: var(--text-primary); font-size: 0.9rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${b.customer_name}</div>
                        <div style="font-size: 0.8rem; color: var(--text-secondary);">${b.booking_time.substring(0,5)} · ${b.service_name || 'Sin servicio'}</div>
                    </div>
                    ${b.customer_phone
                        ? `<button onclick="dashboard.sendReminder24hFromDashboard(${b.id})"
                                   title="Enviar recordatorio por WhatsApp"
                                   style="flex-shrink: 0; background: linear-gradient(135deg, #25D366, #128C7E); color: white; border: none; padding: 0.3rem 0.65rem; border-radius: 6px; font-size: 0.8rem; font-weight: 600; cursor: pointer;">WA</button>`
                        : `<span style="font-size: 0.75rem; color: var(--text-secondary);">Sin tel.</span>`
                    }
                </div>
            `).join('')}
        </div>`;
    },

    renderActionBoxFeedback(pending) {
        if (pending.length === 0) {
            return '<div style="padding: 1.25rem; text-align: center; color: var(--text-secondary); font-size: 0.9rem;">Sin feedback pendiente</div>';
        }
        return `<div style="padding: 0.5rem 0.75rem;">
            ${pending.map(b => `
                <div style="display: flex; justify-content: space-between; align-items: center; gap: 0.5rem; padding: 0.6rem 0.25rem; border-bottom: 1px solid var(--border-color);">
                    <div style="flex: 1; min-width: 0;">
                        <div style="font-weight: 600; color: var(--text-primary); font-size: 0.9rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${b.customer_name}</div>
                        <div style="font-size: 0.8rem; color: var(--text-secondary);">${b.service_name || 'Sin servicio'} · ${new Date(b.booking_date).toLocaleDateString('es-ES', {day: 'numeric', month: 'short'})}</div>
                    </div>
                    ${b.customer_phone
                        ? `<button onclick="dashboard.sendFeedbackFromDashboard(${b.id})"
                                   title="Enviar encuesta de feedback por WhatsApp"
                                   style="flex-shrink: 0; background: linear-gradient(135deg, #25D366, #128C7E); color: white; border: none; padding: 0.3rem 0.65rem; border-radius: 6px; font-size: 0.8rem; font-weight: 600; cursor: pointer;">WA</button>`
                        : `<span style="font-size: 0.75rem; color: var(--text-secondary);">Sin tel.</span>`
                    }
                </div>
            `).join('')}
        </div>`;
    },

    renderActionBoxCanceladas(cancelled) {
        if (cancelled.length === 0) {
            return '<div style="padding: 1.25rem; text-align: center; color: var(--text-secondary); font-size: 0.9rem;">Sin cancelaciones recientes</div>';
        }
        return `<div style="padding: 0.5rem 0.75rem;">
            ${cancelled.map(b => `
                <div style="padding: 0.6rem 0.25rem; border-bottom: 1px solid var(--border-color);">
                    <div style="font-weight: 600; color: var(--text-primary); font-size: 0.9rem;">${b.customer_name}</div>
                    <div style="font-size: 0.8rem; color: var(--text-secondary);">
                        ${new Date(b.booking_date).toLocaleDateString('es-ES', {day: 'numeric', month: 'short'})} · ${b.service_name || 'Sin servicio'}
                    </div>
                    ${b.cancellation_reason
                        ? `<div style="font-size: 0.78rem; color: var(--text-secondary); font-style: italic; margin-top: 0.2rem;">"${b.cancellation_reason}"</div>`
                        : ''
                    }
                </div>
            `).join('')}
        </div>`;
    },

    openActionBoxModal(boxId) {
        // Para canceladas reutilizamos el modal ya existente
        if (boxId === 'canceladas') {
            this.openCancelledModal();
            return;
        }

        const cfgMap = {
            hoy:      { title: 'Reservas de Hoy',                    icon: '📅', color: '#3b82f6', empty: 'No hay reservas programadas para hoy',    items: () => this.todayBookings    || [], renderFn: (items) => this.renderActionBoxHoy(items) },
            manana:   { title: 'Recordatorio 24h — Citas de Mañana', icon: '⏰', color: '#8b5cf6', empty: 'No hay reservas para mañana',              items: () => this.tomorrowBookings || [], renderFn: (items) => this.renderActionBoxManana(items) },
            feedback: { title: 'Feedback post-cita pendiente',        icon: '⭐', color: '#f59e0b', empty: 'No hay encuestas de feedback pendientes',  items: () => this.feedbackPending  || [], renderFn: (items) => this.renderActionBoxFeedback(items) },
        };

        const cfg = cfgMap[boxId];
        if (!cfg) return;

        const items = cfg.items();

        // Overlay
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        overlay.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 10000; animation: fadeIn 0.2s ease;';

        // Modal
        const modal = document.createElement('div');
        modal.style.cssText = 'background: var(--bg-secondary); border-radius: 16px; max-width: 800px; width: 90%; max-height: 85vh; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.5); animation: slideUp 0.3s ease; display: flex; flex-direction: column;';

        // Header
        const header = document.createElement('div');
        header.style.cssText = `padding: 1.5rem; border-bottom: 1px solid rgba(255,255,255,0.1); display: flex; justify-content: space-between; align-items: center; background: linear-gradient(135deg, ${cfg.color}15, ${cfg.color}05); flex-shrink: 0;`;
        header.innerHTML = `
            <div>
                <h2 style="margin: 0; font-size: 1.5rem; color: var(--text-primary); display: flex; align-items: center; gap: 0.5rem;">
                    ${cfg.icon} ${cfg.title}
                </h2>
                <p id="action-modal-count" style="margin: 0.4rem 0 0 0; color: var(--text-secondary); font-size: 0.9rem;">
                    ${items.length} ${items.length === 1 ? 'elemento' : 'elementos'}
                </p>
            </div>
            <button id="close-action-modal" style="background: none; border: none; font-size: 1.5rem; cursor: pointer; color: var(--text-secondary); padding: 0.5rem;">✕</button>
        `;

        // Content
        const content = document.createElement('div');
        content.id = 'action-modal-content-' + boxId;
        content.style.cssText = 'overflow-y: auto; flex: 1;';
        content.innerHTML = items.length === 0
            ? `<div style="text-align: center; padding: 3rem; color: var(--text-secondary);"><div style="font-size: 3rem; margin-bottom: 1rem;">${cfg.icon}</div><p style="font-size: 1.1rem; margin: 0;">${cfg.empty}</p></div>`
            : cfg.renderFn(items);

        // Footer
        const footer = document.createElement('div');
        footer.style.cssText = 'padding: 1rem 1.5rem; border-top: 1px solid rgba(255,255,255,0.1); display: flex; justify-content: flex-end; flex-shrink: 0;';
        footer.innerHTML = `
            <button id="close-action-modal-btn" style="padding: 0.75rem 1.5rem; background: rgba(255,255,255,0.1); color: var(--text-primary); border: none; border-radius: 8px; cursor: pointer; font-weight: 600;"
                    onmouseover="this.style.background='rgba(255,255,255,0.2)'"
                    onmouseout="this.style.background='rgba(255,255,255,0.1)'">Cerrar</button>
        `;

        modal.appendChild(header);
        modal.appendChild(content);
        modal.appendChild(footer);
        overlay.appendChild(modal);
        document.body.appendChild(overlay);

        const closeModal = () => {
            overlay.style.animation = 'fadeOut 0.2s ease';
            setTimeout(() => { if (document.body.contains(overlay)) document.body.removeChild(overlay); }, 200);
        };

        document.getElementById('close-action-modal').addEventListener('click', closeModal);
        document.getElementById('close-action-modal-btn').addEventListener('click', closeModal);
        overlay.addEventListener('click', e => { if (e.target === overlay) closeModal(); });
    },

    sendReminder24hFromDashboard(bookingId) {
        const booking = (this.tomorrowBookings || []).find(b => b.id === bookingId);
        if (!booking || !booking.customer_phone) return;

        const defaultMsg = 'Hola {nombre},\n\nTe recordamos tu cita de mañana en {nombre_negocio}.\n\nFecha: {fecha}\nHora: {hora}\nServicio: {servicio}\n\n¡Te esperamos!';
        const template = (this.bookingSettings && this.bookingSettings.reminder_msg_24h) || defaultMsg;

        const bookingDate = new Date(booking.booking_date);
        const formattedDate = bookingDate.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });

        const message = template
            .replace(/{nombre}/g, booking.customer_name || '')
            .replace(/{nombre_negocio}/g, this.businessSettings.businessName || '')
            .replace(/{fecha}/g, formattedDate)
            .replace(/{hora}/g, booking.booking_time.substring(0, 5))
            .replace(/{servicio}/g, booking.service_name || 'tu servicio');

        let phone = booking.customer_phone.replace(/\D/g, '');
        if (phone.length === 9 && /^[6789]/.test(phone)) phone = '34' + phone;

        window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
    },

    async sendFeedbackFromDashboard(bookingId) {
        const booking = (this.feedbackPending || []).find(b => b.id === bookingId);
        if (!booking || !booking.customer_phone) return;

        const defaultMsg = 'Hola {nombre},\n\n¿Que tal tu {servicio} en {nombre_negocio}?\n\nNos encantaría conocer tu opinión:\n{enlace}\n\n¡Gracias!';
        const template = (this.bookingSettings && this.bookingSettings.reminder_msg_feedback) || defaultMsg;

        const feedbackUrl = `https://stickywork.com/feedback.html?token=${booking.feedback_token}`;

        const message = template
            .replace(/{nombre}/g, booking.customer_name || '')
            .replace(/{nombre_negocio}/g, this.businessSettings.businessName || '')
            .replace(/{servicio}/g, booking.service_name || 'tu servicio')
            .replace(/{enlace}/g, feedbackUrl);

        let phone = booking.customer_phone.replace(/\D/g, '');
        if (phone.length === 9 && /^[6789]/.test(phone)) phone = '34' + phone;

        window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');

        // Marcar como enviado y actualizar UI
        try {
            await api.fetch(`/api/admin/feedback/mark-sent/${bookingId}`, { method: 'POST' });
            this.feedbackPending = this.feedbackPending.filter(b => b.id !== bookingId);

            // Actualizar badge del card
            const countEl = document.getElementById('dash-count-feedback');
            if (countEl) countEl.textContent = this.feedbackPending.length;

            // Actualizar contenido del modal si está abierto
            const modalContent = document.getElementById('action-modal-content-feedback');
            if (modalContent) {
                modalContent.innerHTML = this.feedbackPending.length === 0
                    ? '<div style="text-align: center; padding: 3rem; color: var(--text-secondary);"><div style="font-size: 3rem; margin-bottom: 1rem;">⭐</div><p style="font-size: 1.1rem; margin: 0;">No hay encuestas de feedback pendientes</p></div>'
                    : this.renderActionBoxFeedback(this.feedbackPending);
                const countModal = document.getElementById('action-modal-count');
                if (countModal) countModal.textContent = `${this.feedbackPending.length} ${this.feedbackPending.length === 1 ? 'elemento' : 'elementos'}`;
            }
        } catch (e) {
            console.error('Error al marcar feedback como enviado:', e);
        }
    }
};

// Export
window.dashboard = dashboard;
