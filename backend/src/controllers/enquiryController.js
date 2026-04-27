const Enquiry = require('../models/Enquiry');
const { serializeEnquiry } = require('../utils/serializers');

const getEnquiries = async (req, res) => {
  try {
    const { search } = req.query;
    const filter = {};

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }

    const rows = await Enquiry.find(filter).sort({ created_at: -1 });
    return res.json(rows.map(serializeEnquiry));
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
};

const getEnquiryById = async (req, res) => {
  try {
    const enquiry = await Enquiry.findById(req.params.id);
    if (!enquiry) return res.status(404).json({ error: 'Enquiry not found' });
    return res.json(serializeEnquiry(enquiry));
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
};

const createEnquiry = async (req, res) => {
  try {
    const { name, phone, email, date_of_enquiry, follow_up_date, status, notes } = req.body;
    if (!name || !phone || !date_of_enquiry) {
      return res.status(400).json({ error: 'Name, phone, and date_of_enquiry are required' });
    }

    const enquiry = await Enquiry.create({
      name,
      phone,
      email: email || null,
      date_of_enquiry: new Date(date_of_enquiry),
      follow_up_date: follow_up_date ? new Date(follow_up_date) : null,
      status: status || 'Open',
      notes: notes || null,
    });

    return res.status(201).json(serializeEnquiry(enquiry));
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
};

const updateEnquiry = async (req, res) => {
  try {
    const { name, phone, email, date_of_enquiry, follow_up_date, status, notes } = req.body;
    if (!name || !phone || !date_of_enquiry) {
      return res.status(400).json({ error: 'Name, phone, and date_of_enquiry are required' });
    }

    const updated = await Enquiry.findByIdAndUpdate(
      req.params.id,
      {
        name,
        phone,
        email: email || null,
        date_of_enquiry: new Date(date_of_enquiry),
        follow_up_date: follow_up_date ? new Date(follow_up_date) : null,
        status: status || 'Open',
        notes: notes || null,
      },
      { new: true }
    );

    if (!updated) return res.status(404).json({ error: 'Enquiry not found' });
    return res.json(serializeEnquiry(updated));
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
};

const deleteEnquiry = async (req, res) => {
  try {
    const deleted = await Enquiry.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Enquiry not found' });

    return res.json({ message: 'Enquiry deleted' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { getEnquiries, getEnquiryById, createEnquiry, updateEnquiry, deleteEnquiry };
