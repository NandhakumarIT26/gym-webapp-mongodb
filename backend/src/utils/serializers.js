const { formatDate } = require('./date');

const serializePlan = (plan) => {
  if (!plan) return null;
  const p = typeof plan.toJSON === 'function' ? plan.toJSON() : plan;
  return p;
};

const serializeMember = (member) => {
  if (!member) return null;

  const m = typeof member.toJSON === 'function' ? member.toJSON() : member;
  const plan = m.plan_id && typeof m.plan_id === 'object' && m.plan_id.name ? m.plan_id : null;

  return {
    ...m,
    plan_id: plan ? plan.id : (m.plan_id ? m.plan_id.toString() : null),
    plan_name: plan ? plan.name : undefined,
    plan_price: plan ? plan.price : undefined,
    duration_days: plan ? plan.duration_days : undefined,
    join_date: formatDate(m.join_date),
    expiry_date: formatDate(m.expiry_date),
    created_at: m.created_at ? new Date(m.created_at).toISOString() : null,
  };
};

const serializePayment = (payment) => {
  const p = typeof payment.toJSON === 'function' ? payment.toJSON() : payment;
  const member = p.member_id && typeof p.member_id === 'object' && p.member_id.name ? p.member_id : null;

  return {
    ...p,
    member_id: member ? member.id : (p.member_id ? p.member_id.toString() : null),
    member_name: member ? member.name : undefined,
    member_phone: member ? member.phone : undefined,
    phone: member ? member.phone : undefined,
    created_at: p.created_at ? new Date(p.created_at).toISOString() : null,
  };
};

const serializeAttendance = (attendance) => {
  const a = typeof attendance.toJSON === 'function' ? attendance.toJSON() : attendance;
  const member = a.member_id && typeof a.member_id === 'object' && a.member_id.name ? a.member_id : null;

  return {
    ...a,
    member_id: member ? member.id : (a.member_id ? a.member_id.toString() : null),
    member_name: member ? member.name : undefined,
    phone: member ? member.phone : undefined,
    check_in_date: formatDate(a.check_in_date),
  };
};

const serializeEnquiry = (enquiry) => {
  const e = typeof enquiry.toJSON === 'function' ? enquiry.toJSON() : enquiry;
  return {
    ...e,
    date_of_enquiry: formatDate(e.date_of_enquiry),
    follow_up_date: formatDate(e.follow_up_date),
    created_at: e.created_at ? new Date(e.created_at).toISOString() : null,
  };
};

const serializeExpense = (expense) => {
  const e = typeof expense.toJSON === 'function' ? expense.toJSON() : expense;
  return {
    ...e,
    date: formatDate(e.date),
    created_at: e.created_at ? new Date(e.created_at).toISOString() : null,
  };
};

module.exports = {
  serializePlan,
  serializeMember,
  serializePayment,
  serializeAttendance,
  serializeEnquiry,
  serializeExpense,
};
