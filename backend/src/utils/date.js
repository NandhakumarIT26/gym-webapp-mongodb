const formatDate = (value) => {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().split('T')[0];
};

const todayDateString = () => new Date().toISOString().split('T')[0];

module.exports = {
  formatDate,
  todayDateString,
};
