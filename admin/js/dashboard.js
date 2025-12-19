// Dashboard Module

const dashboard = {
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
            const today = new Date().toISOString().split('T')[0];
            const todayBookings = allBookings.filter(booking =>
                booking.booking_date.startsWith(today) &&
                booking.status !== 'cancelled'
            ).sort((a, b) => a.booking_time.localeCompare(b.booking_time));

            // Process trend data (last 7 weeks)
            const trendData = this.processTrendData(allBookings);

            // Calculate month comparison
            const monthComparison = this.calculateMonthComparison(allBookings);

            // Load business info
            const businessData = await api.get(`/api/business/${auth.getBusinessId()}`);
            document.getElementById('businessName').textContent = businessData.data.name;

            // Render dashboard
            contentArea.innerHTML = `
                <!-- Stats Grid -->
                <div class="stats-grid">
                    ${createStatCard({
                        icon: '📊',
                        value: stats.totalBookings || 0,
                        label: 'Total Reservas',
                        iconBg: 'rgba(59, 130, 246, 0.1)'
                    })}

                    <div class="stat-card">
                        <div class="stat-icon" style="background: rgba(34, 197, 94, 0.1);">📅</div>
                        <div class="stat-content">
                            <div class="stat-value">${stats.thisMonth || 0}</div>
                            <div class="stat-label">Reservas Este Mes</div>
                            ${monthComparison.change !== 0 ? `
                                <div style="margin-top: 0.5rem; display: flex; align-items: center; justify-content: center; gap: 0.5rem;">
                                    <span style="
                                        color: ${monthComparison.change > 0 ? '#22c55e' : '#ef4444'};
                                        font-weight: 700;
                                        font-size: 0.9rem;
                                        display: flex;
                                        align-items: center;
                                        gap: 0.25rem;
                                    ">
                                        ${monthComparison.change > 0 ? '▲' : '▼'}
                                        ${Math.abs(monthComparison.percentage)}%
                                    </span>
                                    <span style="color: var(--text-tertiary); font-size: 0.8rem;">
                                        vs mes anterior
                                    </span>
                                </div>
                            ` : monthComparison.lastMonth > 0 ? `
                                <div style="margin-top: 0.5rem; font-size: 0.8rem; color: var(--text-tertiary);">
                                    ≈ Igual que mes anterior
                                </div>
                            ` : ''}
                        </div>
                    </div>

                    ${createStatCard({
                        icon: '⏳',
                        value: stats.bookingsByStatus.find(s => s.status === 'pending')?.count || 0,
                        label: 'Pendientes',
                        iconBg: 'rgba(234, 179, 8, 0.1)'
                    })}

                    ${createStatCard({
                        icon: '✅',
                        value: stats.bookingsByStatus.find(s => s.status === 'confirmed')?.count || 0,
                        label: 'Confirmadas',
                        iconBg: 'rgba(239, 68, 68, 0.1)'
                    })}

                    <div class="stat-card" style="cursor: pointer; transition: transform 0.2s ease;"
                         onclick="dashboard.openCancelledModal()"
                         onmouseover="this.style.transform='translateY(-5px)'; this.style.boxShadow='0 8px 20px rgba(0,0,0,0.15)'"
                         onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 12px rgba(0,0,0,0.1)'">
                        <div class="stat-icon" style="background: rgba(239, 68, 68, 0.1);">❌</div>
                        <div class="stat-content">
                            <div class="stat-value">${stats.cancelledFuture || 0}</div>
                            <div class="stat-label">Canceladas</div>
                            <div style="margin-top: 0.5rem; font-size: 0.8rem; color: var(--text-tertiary);">
                                (futuras)
                            </div>
                        </div>
                    </div>
                </div>

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
                <div style="display: flex; align-items: flex-end; justify-content: space-between; gap: 0.5rem; height: 200px; margin-bottom: 1rem;">
                    ${trendData.map((week, index) => {
                        const height = maxCount > 0 ? (week.count / maxCount) * 100 : 0;
                        const isCurrentWeek = index === trendData.length - 1;

                        return `
                            <div style="flex: 1; display: flex; flex-direction: column; align-items: center; gap: 0.5rem;">
                                <!-- Bar -->
                                <div style="width: 100%; display: flex; flex-direction: column; justify-content: flex-end; height: 100%;">
                                    ${week.count > 0 ? `
                                        <div style="
                                            width: 100%;
                                            height: ${height}%;
                                            background: ${isCurrentWeek ? 'linear-gradient(180deg, var(--primary-color), var(--secondary-color))' : 'linear-gradient(180deg, rgba(59, 130, 246, 0.8), rgba(59, 130, 246, 0.5))'};
                                            border-radius: 8px 8px 0 0;
                                            transition: all 0.3s ease;
                                            position: relative;
                                            cursor: pointer;
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
                    this.loadStats(); // Refresh stats
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
    }
};

// Export
window.dashboard = dashboard;
