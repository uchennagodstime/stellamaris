

import {
    createClient
} from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

import {
    SUPABASE_URL,
    SUPABASE_ANON_KEY
} from './supabase-config.js';

// Connect to Supabase
const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Page elements
const loginPanel = document.querySelector('#login-panel');
const ordersPanel = document.querySelector('#orders-panel');
const loginForm = document.querySelector('#login-form');
const ordersBody = document.querySelector('#orders-body');

const loginFeedback = document.querySelector('#login-feedback');
const adminFeedback = document.querySelector('#admin-feedback');

const refreshButton = document.querySelector('#refresh-orders');
const logoutButton = document.querySelector('#logout');

// Available order statuses from the database schema
const ORDER_STATUSES = [
    'new',
    'reviewing',
    'awaiting_deposit',
    'in_production',
    'completed',
    'cancelled'
];

let currentUser = null;
let loadingOrders = false;

// Display messages safely
function showMessage(element, message, isError = false) {
    element.hidden = false;
    element.textContent = message;
    element.classList.toggle('error', isError);
    element.classList.toggle('success', !isError);
}

function clearMessage(element) {
    element.hidden = true;
    element.textContent = '';
}

function showLogin() {
    loginPanel.classList.remove('hidden');
    ordersPanel.classList.add('hidden');
    currentUser = null;
}

function showDashboard() {
    loginPanel.classList.add('hidden');
    ordersPanel.classList.remove('hidden');
}

// Verify that the signed-in user has admin privileges
async function verifyAdmin() {
    const {
        data: {
            user
        },
        error: userError
    } = await db.auth.getUser();

    if (userError || !user) {
        showLogin();
        return false;
    }

    const {
        data: roleData,
        error: roleError
    } = await db
        .from('staff_roles')
        .select('role')
        .eq('user_id', user.id)
        .maybeSingle();

    if (roleError) {
        showLogin();
        showMessage(
            loginFeedback,
            'Unable to verify staff permissions. Please try again.',
            true
        );
        console.error('Role verification error:', roleError);
        return false;
    }

    if (!roleData || roleData.role !== 'admin') {
        await db.auth.signOut();
        showLogin();

        showMessage(
            loginFeedback,
            'Access denied. This account does not have administrator permissions.',
            true
        );

        return false;
    }

    currentUser = user;
    return true;
}

// Authenticate staff
loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    clearMessage(loginFeedback);

    const email = document.querySelector('#admin-email').value.trim();
    const password = document.querySelector('#admin-password').value;

    const submitButton = loginForm.querySelector('button[type="submit"], button:not([type])');

    submitButton.disabled = true;
    submitButton.textContent = 'Signing in...';

    try {
        const {
            error
        } = await db.auth.signInWithPassword({
            email,
            password
        });

        if (error) {
            showMessage(loginFeedback, error.message, true);
            return;
        }

        const isAdmin = await verifyAdmin();

        if (!isAdmin) return;

        showDashboard();
        await loadOrders();

        loginForm.reset();

    } catch (error) {
        console.error(error);
        showMessage(loginFeedback, 'Something went wrong. Please try again.', true);

    } finally {
        submitButton.disabled = false;
        submitButton.textContent = 'Sign in';
    }
});


// Create a safe table cell
function createCell(value) {
    const cell = document.createElement('td');

    cell.textContent = value ?? '—';
    return cell;
}

// Format dates
function formatDate(value) {
    if (!value) return '—';

    const date = new Date(`${value}T00:00:00`);

    if (Number.isNaN(date.getTime())) return value;

    return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });
}

// Display orders
async function loadOrders() {
    if (!currentUser || loadingOrders) return;

    loadingOrders = true;
    clearMessage(adminFeedback);

    ordersBody.replaceChildren();

    const loadingRow = document.createElement('tr');
    const loadingCell = document.createElement('td');

    loadingCell.colSpan = 8;
    loadingCell.textContent = 'Loading customer orders...';

    loadingRow.append(loadingCell);
    ordersBody.append(loadingRow);

    try {
        const {
            data: orders,
            error
        } = await db
            .from('orders')
            .select(`
                id,
                order_number,
                customer_name,
                customer_email,
                customer_phone,
                category,
                event_name,
                date_needed,
                preferred_colours,
                budget,
                usual_size,
                fabric_preference,
                measurements,
                design_details,
                status,
                created_at,
                updated_at
            `)
            .order('created_at', {
                ascending: false
            });

        if (error) throw error;

        ordersBody.replaceChildren();

        if (!orders || orders.length === 0) {
            const row = document.createElement('tr');
            const cell = document.createElement('td');

            cell.colSpan = 8;
            cell.textContent = 'No customer orders received yet.';

            row.append(cell);
            ordersBody.append(row);
            return;
        }

        orders.forEach((order) => {
            const row = document.createElement('tr');

            // 1. Order number
            row.append(createCell(order.order_number));

            // 2. Customer name
            row.append(createCell(order.customer_name));

            // 3. Customer email
            row.append(createCell(order.customer_email));

            // 4. Customer phone
            row.append(createCell(order.customer_phone));

            // 5. Design information
            const designCell = document.createElement('td');

            const designInfo = [
                `Category: ${order.category}`,
                order.event_name && `Event: ${order.event_name}`,
                order.preferred_colours && `Colours: ${order.preferred_colours}`,
                order.budget && `Budget: ${order.budget}`,
                order.usual_size && `Size: ${order.usual_size}`,
                order.fabric_preference && `Fabric: ${order.fabric_preference}`,
                order.measurements && `Measurements: ${order.measurements}`,
                order.design_details && `Details: ${order.design_details}`
            ].filter(Boolean);

            designCell.textContent = designInfo.join('\n');
            designCell.style.whiteSpace = 'pre-line';
            row.append(designCell);

            // 6. Required date
            row.append(createCell(formatDate(order.date_needed)));

            // 7. Current order status
            const statusCell = document.createElement('td');
            const statusLabel = document.createElement('span');

            statusLabel.className = 'status';
            statusLabel.textContent = order.status.replaceAll('_', ' ');

            statusCell.append(statusLabel);
            row.append(statusCell);

            // 8. Update controls
            const actionCell = document.createElement('td');
            const actionWrapper = document.createElement('div');

            actionWrapper.className = 'admin-actions';

            const statusSelect = document.createElement('select');
            statusSelect.setAttribute(
                'aria-label',
                `Change status for ${order.order_number}`
            );

            ORDER_STATUSES.forEach((status) => {
                const option = document.createElement('option');

                option.value = status;
                option.textContent = status.replaceAll('_', ' ');

                if (status === order.status) {
                    option.selected = true;
                }

                statusSelect.append(option);
            });

            const saveButton = document.createElement('button');

            saveButton.className = 'btn';
            saveButton.type = 'button';
            saveButton.textContent = 'Save';

            saveButton.addEventListener('click', async () => {
                const newStatus = statusSelect.value;

                saveButton.disabled = true;
                saveButton.textContent = 'Saving...';

                try {
                    const {
                        error
                    } = await db
                        .from('orders')
                        .update({
                            status: newStatus,
                            updated_at: new Date().toISOString()
                        })
                        .eq('id', order.id);

                    if (error) throw error;

                    showMessage(
                        adminFeedback,
                        `Order ${order.order_number} updated successfully.`
                    );

                    await loadOrders();

                } catch (error) {
                    console.error(error);

                    showMessage(
                        adminFeedback,
                        `Unable to update order: ${error.message}`,
                        true
                    );

                    saveButton.disabled = false;
                    saveButton.textContent = 'Save';
                }
            });

            actionWrapper.append(statusSelect, saveButton);
            actionCell.append(actionWrapper);
            row.append(actionCell);

            ordersBody.append(row);
        });

    } catch (error) {
        console.error('Order loading error:', error);

        ordersBody.replaceChildren();

        showMessage(
            adminFeedback,
            `Unable to load orders: ${error.message}`,
            true
        );

    } finally {
        loadingOrders = false;
    }
}

// Refresh orders
refreshButton.addEventListener('click', loadOrders);

// Sign out
logoutButton.addEventListener('click', async () => {
    const {
        error
    } = await db.auth.signOut();

    if (error) {
        showMessage(adminFeedback, error.message, true);
        return;
    }

    showLogin();
    clearMessage(adminFeedback);
});

// Check existing login when the page opens
async function initializeAdmin() {
    const isAdmin = await verifyAdmin();

    if (isAdmin) {
        showDashboard();
        await loadOrders();
    } else {
        showLogin();
    }
}

initializeAdmin();