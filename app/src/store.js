// In-memory student store (resets when the pod restarts)
const DEPARTMENTS = ['BCA', 'BBA', 'B.Tech CSE', 'B.Tech AI', 'MCA'];

function createStore() {
  const students = new Map();
  let nextId = 1;

  function validate(s, { partial = false } = {}) {
    const errors = [];
    if (!partial || s.name !== undefined) {
      if (!s.name || !String(s.name).trim()) errors.push('name is required');
    }
    if (!partial || s.rollNo !== undefined) {
      if (!/^[A-Z0-9-]{3,15}$/i.test(s.rollNo || '')) errors.push('rollNo must be 3-15 letters/digits');
    }
    if (!partial || s.email !== undefined) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.email || '')) errors.push('email is invalid');
    }
    if (!partial || s.department !== undefined) {
      if (!DEPARTMENTS.includes(s.department)) errors.push(`department must be one of: ${DEPARTMENTS.join(', ')}`);
    }
    if (!partial || s.year !== undefined) {
      const y = Number(s.year);
      if (!Number.isInteger(y) || y < 1 || y > 4) errors.push('year must be 1-4');
    }
    return errors;
  }

  function rollNoTaken(rollNo, exceptId) {
    const r = String(rollNo).toUpperCase();
    return [...students.values()].some((s) => s.rollNo === r && s.id !== exceptId);
  }

  return {
    DEPARTMENTS,
    list({ q = '', department = '' } = {}) {
      const term = q.toLowerCase().trim();
      return [...students.values()]
        .filter((s) => !department || s.department === department)
        .filter((s) => !term || s.name.toLowerCase().includes(term) || s.rollNo.toLowerCase().includes(term))
        .sort((a, b) => a.rollNo.localeCompare(b.rollNo));
    },
    get(id) {
      return students.get(Number(id));
    },
    add(data) {
      const errors = validate(data);
      if (!errors.length && rollNoTaken(data.rollNo)) errors.push('rollNo already exists');
      if (errors.length) return { errors };
      const student = {
        id: nextId++,
        name: String(data.name).trim(),
        rollNo: String(data.rollNo).toUpperCase(),
        email: String(data.email).toLowerCase(),
        department: data.department,
        year: Number(data.year),
      };
      students.set(student.id, student);
      return { student };
    },
    update(id, data) {
      const current = students.get(Number(id));
      if (!current) return { notFound: true };
      const errors = validate(data, { partial: true });
      if (!errors.length && data.rollNo && rollNoTaken(data.rollNo, current.id)) errors.push('rollNo already exists');
      if (errors.length) return { errors };
      const updated = { ...current };
      for (const key of ['name', 'rollNo', 'email', 'department', 'year']) {
        if (data[key] !== undefined) updated[key] = data[key];
      }
      updated.rollNo = String(updated.rollNo).toUpperCase();
      updated.year = Number(updated.year);
      students.set(current.id, updated);
      return { student: updated };
    },
    remove(id) {
      return students.delete(Number(id));
    },
    stats() {
      const byDepartment = Object.fromEntries(DEPARTMENTS.map((d) => [d, 0]));
      const byYear = { 1: 0, 2: 0, 3: 0, 4: 0 };
      for (const s of students.values()) {
        byDepartment[s.department] += 1;
        byYear[s.year] += 1;
      }
      return { total: students.size, byDepartment, byYear };
    },
  };
}

function seed(store) {
  [
    { name: 'Aarav Kulkarni', rollNo: 'BCA23001', email: 'aarav@campus.edu', department: 'BCA', year: 3 },
    { name: 'Isha Deshmukh', rollNo: 'BBA24012', email: 'isha@campus.edu', department: 'BBA', year: 2 },
    { name: 'Rohan Patil', rollNo: 'CSE22045', email: 'rohan@campus.edu', department: 'B.Tech CSE', year: 4 },
    { name: 'Sneha Joshi', rollNo: 'AI25007', email: 'sneha@campus.edu', department: 'B.Tech AI', year: 1 },
  ].forEach((s) => store.add(s));
  return store;
}

module.exports = { createStore, seed, DEPARTMENTS };
