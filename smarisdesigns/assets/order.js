import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './supabase-config.js';

const BUSINESS_EMAIL = 'Terabeautystella@gmail.com';
const form = document.querySelector('#order-form');

async function emailOrder(payload) {
  const response = await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(BUSINESS_EMAIL)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify({
      ...payload,
      _subject: `New custom order request — ${payload.order_number}`,
      _template: 'table',
      _replyto: payload.customer_email
    })
  });
  if (!response.ok) throw new Error('Email service request failed');
  const result = await response.json();
  if (result.success === 'false' || result.success === false) throw new Error(result.message || 'Email service rejected the request');
  return result;
}

if (form) {
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const feedback = document.querySelector('#order-feedback');
    const button = document.querySelector('#submit-order');
    const show = (message) => { feedback.hidden = false; feedback.textContent = message; };
    button.disabled = true;
    button.textContent = 'Submitting…';
    feedback.hidden = true;
    const fd = new FormData(form);
    const orderNumber = `SM-${new Date().toISOString().slice(0,10).replaceAll('-','')}-${Math.random().toString(36).slice(2,7).toUpperCase()}`;
    const payload = {
      order_number: orderNumber,
      customer_name: fd.get('customer_name'),
      customer_email: fd.get('customer_email'),
      customer_phone: fd.get('customer_phone'),
      category: fd.get('category'),
      event_name: fd.get('event_name') || 'Not specified',
      date_needed: fd.get('date_needed') || 'Not specified',
      preferred_colours: fd.get('preferred_colours') || 'Not specified',
      budget: fd.get('budget') || 'Not specified',
      usual_size: fd.get('usual_size') || 'Not specified',
      fabric_preference: fd.get('fabric_preference') || 'Not specified',
      measurements: fd.get('measurements') || 'Not provided',
      design_details: fd.get('design_details'),
      reference_image_attached: fd.get('reference')?.size ? 'Customer selected a reference image; image is not attached to this email. Request it directly from the customer.' : 'No reference image'
    };
    try {
      // Save to Supabase if the project credentials have been configured.
      let savedToDatabase = false;
      if (!SUPABASE_URL.startsWith('YOUR_') && !SUPABASE_ANON_KEY.startsWith('YOUR_')) {
        const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        const { error } = await supabase.from('orders').insert({
          customer_name: payload.customer_name,
          customer_email: payload.customer_email,
          customer_phone: payload.customer_phone,
          category: payload.category,
          event_name: payload.event_name === 'Not specified' ? null : payload.event_name,
          date_needed: payload.date_needed === 'Not specified' ? null : payload.date_needed,
          preferred_colours: payload.preferred_colours === 'Not specified' ? null : payload.preferred_colours,
          budget: payload.budget === 'Not specified' ? null : payload.budget,
          usual_size: payload.usual_size === 'Not specified' ? null : payload.usual_size,
          fabric_preference: payload.fabric_preference === 'Not specified' ? null : payload.fabric_preference,
          measurements: payload.measurements === 'Not provided' ? null : payload.measurements,
          design_details: payload.design_details,
          status: 'new'
        });
        if (error) throw error;
        savedToDatabase = true;
      }
      await emailOrder(payload);
      form.reset();
      show(`Thank you! Your order request ${orderNumber} has been emailed to S'Maris Designs. The team will contact you to confirm the price and production timeline.${savedToDatabase ? ' Your request has also been saved in the online order system.' : ' Email delivery is enabled; permanent online order storage will activate after Supabase is configured.'}`);
    } catch (error) {
      console.error(error);
      show('We could not confirm delivery of your order. Please try again or contact S\'Maris Designs directly. If this is the first submission, check the business inbox for FormSubmit verification.');
    } finally {
      button.disabled = false;
      button.textContent = 'Submit Order Request';
    }
  });
}
