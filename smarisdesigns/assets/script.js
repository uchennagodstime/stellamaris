const toggle = document.querySelector('.menu-toggle');
const nav = document.querySelector('.nav');
if (toggle && nav) {
    toggle.addEventListener('click', () => {
        nav.classList.toggle('open');
        toggle.setAttribute('aria-expanded', nav.classList.contains('open') ? 'true' : 'false')
    })
}
document.querySelectorAll('.filter').forEach(btn => btn.addEventListener('click', () => {
    document.querySelectorAll('.filter').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const filter = btn.dataset.filter;
    let shown = 0;
    document.querySelectorAll('[data-category]').forEach(card => {
        const show = filter === 'all' || card.dataset.category === filter;
        card.style.display = show ? '' : 'none';
        if (show) shown++
    });
    const empty = document.querySelector('.empty-state');
    if (empty) empty.style.display = shown ? 'none' : 'block'
}));
document.querySelectorAll('form[data-demo-form]').forEach(form => form.addEventListener('submit', e => {
    e.preventDefault();
    const msg = form.querySelector('.form-success');
    if (msg) {
        msg.hidden = false;
        msg.textContent = 'Thank you! Your details have been prepared. Please connect this form to your business email or order system before publishing.'
    }
    form.reset()
}));
const year = document.querySelector('[data-year]');
if (year) year.textContent = new Date().getFullYear();