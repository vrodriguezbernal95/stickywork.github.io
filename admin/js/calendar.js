// Calendar Module

const calendar = {
    currentDate: new Date(),
    currentView: 'month', // 'month' or 'day'
    bookings: [],

    // Load calendar interface
    async load() {
        const contentArea = document.getElementById('contentArea');
        document.getElementById('pageTitle').textContent = 'Calendario';

        contentArea.innerHTML = `
            <div class="loading">
                <p>Cargando calendario...</p>
            </div>
        `;

        try {
            // Load bookings
            const data = await api.get(`/api/bookings/${auth.getBusinessId()}`);
            this.bookings = data.data;

            this.render();
        } catch (error) {
            console.error('Error loading calendar:', error);
            contentArea.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">⚠️</div>
                    <p>Error al cargar el calendario</p>
                </div>
            `;
        }
    },

    // Render calendar
    render() {
        const contentArea = document.getElementById('contentArea');

        contentArea.innerHTML = `
            <!-- Calendar Header -->
            <div style="background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 15px; padding: 1rem; margin-bottom: 1.5rem;">
                <div class="calendar-header">
                    <!-- Current Period -->
                    <div class="calendar-period">
                        ${this.getCurrentPeriodLabel()}
                    </div>

                    <!-- Navigation -->
                    <div style="display: flex; gap: 0.5rem; align-items: center; flex-wrap: wrap; justify-content: center;">
                        <button class="btn-small" onclick="calendar.previousPeriod()" style="padding: 0.5rem 0.75rem;">
                            ◀
                        </button>
                        <button class="btn-small" onclick="calendar.today()" style="padding: 0.5rem 1rem;">
                            Hoy
                        </button>
                        <button class="btn-small" onclick="calendar.nextPeriod()" style="padding: 0.5rem 0.75rem;">
                            ▶
                        </button>
                    </div>

                    <!-- View Toggle -->
                    <div style="display: flex; gap: 0.5rem; justify-content: center;">
                        <button class="btn-small ${this.currentView === 'month' ? 'btn-primary-small' : ''}"
                                onclick="calendar.switchView('month')" style="padding: 0.5rem 0.75rem;">
                            📅 Mes
                        </button>
                        <button class="btn-small ${this.currentView === 'day' ? 'btn-primary-small' : ''}"
                                onclick="calendar.switchView('day')" style="padding: 0.5rem 0.75rem;">
                            📆 Día
                        </button>
                    </div>
                </div>
            </div>

            <style>
                .calendar-header {
                    display: grid;
                    gap: 1rem;
                    align-items: center;
                }

                .calendar-period {
                    font-size: 1.25rem;
                    font-weight: 700;
                    color: var(--text-primary);
                    text-align: center;
                }

                @media (min-width: 768px) {
                    .calendar-header {
                        grid-template-columns: 1fr auto 1fr;
                    }

                    .calendar-period {
                        text-align: left;
                    }

                    .calendar-header > div:last-child {
                        justify-content: flex-end;
                    }
                }
            </style>

            <!-- Calendar View -->
            <div id="calendarView">
                ${this.currentView === 'month' ? this.renderMonthView() : this.renderDayView()}
            </div>
        `;
    },

    // Render month view
    renderMonthView() {
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();

        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const startingDayOfWeek = firstDay.getDay();
        const daysInMonth = lastDay.getDate();

        // Get bookings for this month
        const monthBookings = this.bookings.filter(booking => {
            const bookingDate = new Date(booking.booking_date);
            return bookingDate.getMonth() === month && bookingDate.getFullYear() === year;
        });

        // Create calendar grid
        let html = `
            <div class="calendar-month-view">
                <!-- Days of week header -->
                <div class="calendar-weekdays">
                    ${['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map((day, index) => `
                        <div class="calendar-weekday">
                            <span class="weekday-full">${day}</span>
                            <span class="weekday-short">${['D', 'L', 'M', 'X', 'J', 'V', 'S'][index]}</span>
                        </div>
                    `).join('')}
                </div>

                <!-- Calendar days -->
                <div class="calendar-days-grid">
        `;

        html += `
            <style>
                .calendar-month-view {
                    background: var(--bg-secondary);
                    border: 1px solid var(--border-color);
                    border-radius: 15px;
                    padding: 0.75rem;
                }

                .calendar-weekdays {
                    display: grid;
                    grid-template-columns: repeat(7, 1fr);
                    gap: 0.25rem;
                    margin-bottom: 0.5rem;
                }

                .calendar-weekday {
                    text-align: center;
                    font-weight: 600;
                    color: var(--text-secondary);
                    padding: 0.5rem 0.25rem;
                    font-size: 0.75rem;
                }

                .weekday-full {
                    display: none;
                }

                .weekday-short {
                    display: inline;
                }

                .calendar-days-grid {
                    display: grid;
                    grid-template-columns: repeat(7, 1fr);
                    gap: 0.25rem;
                }

                .calendar-day-cell {
                    min-height: 60px;
                    background: var(--bg-primary);
                    border: 1px solid var(--border-color);
                    border-radius: 8px;
                    padding: 0.35rem;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    font-size: 0.75rem;
                }

                .calendar-day-cell:hover {
                    transform: scale(1.02);
                }

                .calendar-day-cell.today {
                    border: 2px solid var(--primary-color);
                }

                .calendar-day-number {
                    font-weight: 600;
                    margin-bottom: 0.25rem;
                    font-size: 0.85rem;
                }

                .calendar-day-number.today-number {
                    color: var(--primary-color);
                }

                .calendar-booking-count {
                    font-size: 0.65rem;
                    color: var(--text-secondary);
                }

                .calendar-booking-time {
                    font-size: 0.6rem;
                    background: rgba(59, 130, 246, 0.1);
                    padding: 0.15rem 0.3rem;
                    border-radius: 4px;
                    margin-top: 0.15rem;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }

                @media (min-width: 768px) {
                    .calendar-month-view {
                        padding: 1.5rem;
                    }

                    .calendar-weekdays {
                        gap: 0.5rem;
                        margin-bottom: 0.5rem;
                    }

                    .calendar-weekday {
                        padding: 0.5rem;
                        font-size: 0.9rem;
                    }

                    .weekday-full {
                        display: inline;
                    }

                    .weekday-short {
                        display: none;
                    }

                    .calendar-days-grid {
                        gap: 0.5rem;
                    }

                    .calendar-day-cell {
                        min-height: 80px;
                        padding: 0.5rem;
                        font-size: 0.85rem;
                    }

                    .calendar-day-number {
                        font-size: 1rem;
                    }

                    .calendar-booking-count {
                        font-size: 0.75rem;
                    }

                    .calendar-booking-time {
                        font-size: 0.7rem;
                        padding: 0.2rem 0.4rem;
                        margin-top: 0.2rem;
                    }
                }
            </style>
        `;

        // Empty cells before month starts
        for (let i = 0; i < startingDayOfWeek; i++) {
            html += `<div class="calendar-day-cell" style="opacity: 0.3;"></div>`;
        }

        // Days of month
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const dayBookings = monthBookings.filter(b => b.booking_date.startsWith(dateStr));
            const isToday = this.isToday(date);

            html += `
                <div class="calendar-day-cell ${isToday ? 'today' : ''}"
                     onclick="calendar.selectDate(new Date(${year}, ${month}, ${day}))">
                    <div class="calendar-day-number ${isToday ? 'today-number' : ''}">
                        ${day}
                    </div>
                    ${dayBookings.length > 0 ? `
                        <div class="calendar-booking-count">
                            ${dayBookings.length} reserva${dayBookings.length > 1 ? 's' : ''}
                        </div>
                        ${dayBookings.slice(0, 2).map(booking => `
                            <div class="calendar-booking-time" title="${booking.customer_name} - ${booking.booking_time}">
                                ${booking.booking_time.substring(0, 5)}
                            </div>
                        `).join('')}
                        ${dayBookings.length > 2 ? `
                            <div class="calendar-booking-count" style="margin-top: 0.2rem;">
                                +${dayBookings.length - 2} más
                            </div>
                        ` : ''}
                    ` : ''}
                </div>
            `;
        }

        html += `
                </div>
            </div>
        `;

        return html;
    },

    // Render day view
    renderDayView() {
        const dateStr = `${this.currentDate.getFullYear()}-${String(this.currentDate.getMonth() + 1).padStart(2, '0')}-${String(this.currentDate.getDate()).padStart(2, '0')}`;
        const dayBookings = this.bookings.filter(b => b.booking_date.startsWith(dateStr));

        // Sort by time
        dayBookings.sort((a, b) => a.booking_time.localeCompare(b.booking_time));

        return `
            <div style="background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 15px; padding: 1.5rem;">
                <div style="margin-bottom: 1.5rem;">
                    <h3 style="margin: 0 0 0.5rem 0;">
                        ${this.currentDate.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </h3>
                    <p style="margin: 0; color: var(--text-secondary);">
                        ${dayBookings.length} reserva${dayBookings.length !== 1 ? 's' : ''} programada${dayBookings.length !== 1 ? 's' : ''}
                    </p>
                </div>

                ${dayBookings.length === 0 ? `
                    <div class="empty-state">
                        <div class="empty-state-icon">📅</div>
                        <p>No hay reservas para este día</p>
                    </div>
                ` : `
                    <div style="display: grid; gap: 1rem;">
                        ${dayBookings.map(booking => `
                            <div class="feature-card" style="text-align: left; border-left: 4px solid ${this.getStatusColor(booking.status)};">
                                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 0.75rem;">
                                    <div>
                                        <div style="font-size: 1.5rem; font-weight: 700; color: var(--primary-color); margin-bottom: 0.25rem;">
                                            ${booking.booking_time.substring(0, 5)}
                                        </div>
                                        <div style="font-weight: 600; font-size: 1.1rem; color: var(--text-primary);">
                                            ${booking.customer_name}
                                        </div>
                                    </div>
                                    <span class="status-badge status-${booking.status}">
                                        ${this.getStatusLabel(booking.status)}
                                    </span>
                                </div>

                                <div style="display: grid; gap: 0.5rem; font-size: 0.9rem; color: var(--text-secondary);">
                                    <div>📧 ${booking.customer_email}</div>
                                    <div>📞 ${booking.customer_phone}</div>
                                    ${booking.service_name ? `<div>🛠️ ${booking.service_name}</div>` : ''}
                                    ${booking.notes ? `
                                        <div style="margin-top: 0.5rem; padding: 0.75rem; background: var(--bg-primary); border-radius: 8px;">
                                            <strong>Notas:</strong> ${booking.notes}
                                        </div>
                                    ` : ''}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                `}
            </div>
        `;
    },

    // Helper: Get current period label
    getCurrentPeriodLabel() {
        if (this.currentView === 'month') {
            return this.currentDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
        } else {
            return this.currentDate.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
        }
    },

    // Helper: Check if date is today
    isToday(date) {
        const today = new Date();
        return date.getDate() === today.getDate() &&
               date.getMonth() === today.getMonth() &&
               date.getFullYear() === today.getFullYear();
    },

    // Helper: Get status color
    getStatusColor(status) {
        const colors = {
            'pending': '#eab308',
            'confirmed': '#22c55e',
            'cancelled': '#ef4444',
            'completed': '#3b82f6'
        };
        return colors[status] || '#999';
    },

    // Helper: Get status label
    getStatusLabel(status) {
        const labels = {
            'pending': 'Pendiente',
            'confirmed': 'Confirmada',
            'cancelled': 'Cancelada',
            'completed': 'Completada'
        };
        return labels[status] || status;
    },

    // Navigate to previous period
    previousPeriod() {
        if (this.currentView === 'month') {
            this.currentDate.setMonth(this.currentDate.getMonth() - 1);
        } else {
            this.currentDate.setDate(this.currentDate.getDate() - 1);
        }
        this.render();
    },

    // Navigate to next period
    nextPeriod() {
        if (this.currentView === 'month') {
            this.currentDate.setMonth(this.currentDate.getMonth() + 1);
        } else {
            this.currentDate.setDate(this.currentDate.getDate() + 1);
        }
        this.render();
    },

    // Go to today
    today() {
        this.currentDate = new Date();
        this.render();
    },

    // Switch view
    switchView(view) {
        this.currentView = view;
        this.render();
    },

    // Select a date (from month view)
    selectDate(date) {
        this.currentDate = date;
        this.currentView = 'day';
        this.render();
    }
};

// Export
window.calendar = calendar;
