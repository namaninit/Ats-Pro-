require('dotenv').config();
const bcrypt = require('bcryptjs');
const { sequelize, User, Client, Job, Candidate, Interview } = require('./models');

async function seed() {
  try {
    await sequelize.authenticate();
    await sequelize.sync({ force: true });
    console.log('✅ Database synced (force: true — all tables recreated)');

    // Users
    const adminHash = await bcrypt.hash('admin123', 12);
    const recruiterHash = await bcrypt.hash('recruiter123', 12);

    const admin = await User.create({ name: 'Super Admin', email: 'admin@ats.com', password: adminHash, role: 'super_admin' });
    const recruiter = await User.create({ name: 'Priya Sharma', email: 'priya@ats.com', password: recruiterHash, role: 'recruiter' });
    const recruiter2 = await User.create({ name: 'Rahul Verma', email: 'rahul@ats.com', password: recruiterHash, role: 'recruiter' });
    console.log('✅ Users created');

    // Clients
    const tcs = await Client.create({ companyName: 'TCS', industry: 'IT Services', website: 'https://tcs.com', contactPerson: 'Ananya Singh', contactEmail: 'hr@tcs.com', contactPhone: '+91-9876543210', address: 'Mumbai, Maharashtra', status: 'active' });
    const infosys = await Client.create({ companyName: 'Infosys', industry: 'IT Consulting', website: 'https://infosys.com', contactPerson: 'Vikram Nair', contactEmail: 'talent@infosys.com', contactPhone: '+91-9876543211', address: 'Bengaluru, Karnataka', status: 'active' });
    const startup = await Client.create({ companyName: 'WebDisha Technologies', industry: 'Digital Agency', website: 'https://webdisha.com', contactPerson: 'Naman Jain', contactEmail: 'naman@webdisha.com', contactPhone: '+91-9876543212', address: 'Raipur, Chhattisgarh', status: 'active' });
    console.log('✅ Clients created');

    // Jobs
    const job1 = await Job.create({ title: 'Senior React Developer', clientId: tcs.id, requiredSkills: JSON.stringify(['React', 'TypeScript', 'Node.js', 'AWS']), minExperience: 3, maxExperience: 6, minSalary: 12, maxSalary: 22, location: 'Mumbai / Remote', jobType: 'full_time', status: 'open', openings: 3 });
    const job2 = await Job.create({ title: 'Full Stack Engineer', clientId: infosys.id, requiredSkills: JSON.stringify(['React', 'Java', 'Spring Boot', 'MySQL']), minExperience: 2, maxExperience: 5, minSalary: 8, maxSalary: 18, location: 'Bengaluru', jobType: 'full_time', status: 'open', openings: 5 });
    const job3 = await Job.create({ title: 'Frontend Developer', clientId: startup.id, requiredSkills: JSON.stringify(['React', 'CSS', 'JavaScript', 'Figma']), minExperience: 1, maxExperience: 3, minSalary: 4, maxSalary: 8, location: 'Raipur / Remote', jobType: 'full_time', status: 'open', openings: 2 });
    const job4 = await Job.create({ title: 'DevOps Engineer', clientId: tcs.id, requiredSkills: JSON.stringify(['Docker', 'Kubernetes', 'AWS', 'CI/CD']), minExperience: 3, maxExperience: 7, minSalary: 15, maxSalary: 28, location: 'Hyderabad', jobType: 'full_time', status: 'open', openings: 2 });
    console.log('✅ Jobs created');

    // Candidates
    const candidatesData = [
      { name: 'Arjun Mehta', email: 'arjun.mehta@gmail.com', phone: '+91-9000000001', skills: JSON.stringify(['React', 'TypeScript', 'Node.js']), experience: 4, currentCTC: 12, expectedCTC: 18, noticePeriod: 30, currentLocation: 'Mumbai', status: 'screening', jobId: job1.id, source: 'LinkedIn' },
      { name: 'Sneha Patel', email: 'sneha.patel@gmail.com', phone: '+91-9000000002', skills: JSON.stringify(['React', 'CSS', 'JavaScript']), experience: 2, currentCTC: 5, expectedCTC: 8, noticePeriod: 15, currentLocation: 'Ahmedabad', status: 'interview', jobId: job3.id, source: 'Referral' },
      { name: 'Karan Gupta', email: 'karan.gupta@gmail.com', phone: '+91-9000000003', skills: JSON.stringify(['Java', 'Spring Boot', 'MySQL', 'React']), experience: 3.5, currentCTC: 9, expectedCTC: 15, noticePeriod: 60, currentLocation: 'Bengaluru', status: 'offered', jobId: job2.id, source: 'Naukri' },
      { name: 'Divya Sharma', email: 'divya.sharma@gmail.com', phone: '+91-9000000004', skills: JSON.stringify(['React', 'Node.js', 'MongoDB']), experience: 1.5, currentCTC: 4, expectedCTC: 7, noticePeriod: 0, currentLocation: 'Raipur', status: 'new', jobId: job3.id, source: 'Walk-in' },
      { name: 'Rohit Kumar', email: 'rohit.kumar@gmail.com', phone: '+91-9000000005', skills: JSON.stringify(['Docker', 'Kubernetes', 'AWS', 'Linux']), experience: 5, currentCTC: 18, expectedCTC: 26, noticePeriod: 45, currentLocation: 'Hyderabad', status: 'hired', jobId: job4.id, source: 'LinkedIn' },
      { name: 'Anita Joshi', email: 'anita.joshi@gmail.com', phone: '+91-9000000006', skills: JSON.stringify(['React', 'Vue.js', 'TypeScript']), experience: 3, currentCTC: 10, expectedCTC: 16, noticePeriod: 30, currentLocation: 'Pune', status: 'rejected', jobId: job1.id, source: 'Indeed' },
      { name: 'Vikas Rao', email: 'vikas.rao@gmail.com', phone: '+91-9000000007', skills: JSON.stringify(['React', 'Node.js', 'AWS']), experience: 4.5, currentCTC: 14, expectedCTC: 20, noticePeriod: 30, currentLocation: 'Chennai', status: 'screening', jobId: job1.id, source: 'LinkedIn' },
      { name: 'Pooja Nair', email: 'pooja.nair@gmail.com', phone: '+91-9000000008', skills: JSON.stringify(['Java', 'React', 'SQL']), experience: 2.5, currentCTC: 7, expectedCTC: 12, noticePeriod: 15, currentLocation: 'Bengaluru', status: 'interview', jobId: job2.id, source: 'Referral' },
    ];

    const createdCandidates = await Candidate.bulkCreate(candidatesData);
    console.log('✅ Candidates created');

    // Interviews
    const now = new Date();
    await Interview.bulkCreate([
      { candidateId: createdCandidates[1].id, jobId: job3.id, interviewerId: recruiter.id, scheduledAt: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000), mode: 'video', round: 1, status: 'scheduled', outcome: 'pending', notes: 'Technical round 1 - React fundamentals' },
      { candidateId: createdCandidates[2].id, jobId: job2.id, interviewerId: recruiter2.id, scheduledAt: new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000), mode: 'in_person', round: 2, status: 'scheduled', outcome: 'pending', notes: 'HR + Management round' },
      { candidateId: createdCandidates[7].id, jobId: job2.id, interviewerId: recruiter.id, scheduledAt: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000), mode: 'video', round: 1, status: 'scheduled', outcome: 'pending', notes: 'Initial screening' },
      { candidateId: createdCandidates[4].id, jobId: job4.id, interviewerId: recruiter2.id, scheduledAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), mode: 'in_person', round: 3, status: 'completed', outcome: 'pass', feedback: 'Excellent DevOps skills, strong AWS experience. Recommended for hire.' },
      { candidateId: createdCandidates[5].id, jobId: job1.id, interviewerId: recruiter.id, scheduledAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000), mode: 'video', round: 1, status: 'completed', outcome: 'fail', feedback: 'React knowledge is outdated, not familiar with hooks and modern patterns.' },
    ]);
    console.log('✅ Interviews created');

    console.log('\n🎉 Seed complete!\n');
    console.log('═══════════════════════════════════════');
    console.log('  Login Credentials:');
    console.log('  Super Admin: admin@ats.com / admin123');
    console.log('  Recruiter:   priya@ats.com / recruiter123');
    console.log('  Recruiter:   rahul@ats.com / recruiter123');
    console.log('═══════════════════════════════════════\n');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  }
}

seed();
