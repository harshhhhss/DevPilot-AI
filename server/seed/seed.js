/**
 * Demo data seed script for DevPilot AI.
 *
 * Wipes and repopulates the database with a realistic demo organization,
 * one team per role, and a full "E-Commerce Platform" project (sprints,
 * tasks across every Kanban column, bugs, comments, notifications) so the
 * app can be demonstrated without manually creating data.
 *
 * Usage: npm run seed   (from server/)
 *
 * NEVER run this against a production database — it deletes existing data.
 */
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');

const Organization = require('../models/Organization');
const User = require('../models/User');
const Project = require('../models/Project');
const Sprint = require('../models/Sprint');
const Task = require('../models/Task');
const Bug = require('../models/Bug');
const Comment = require('../models/Comment');
const Notification = require('../models/Notification');
const Meeting = require('../models/Meeting');
const ActivityLog = require('../models/ActivityLog');

// Demo credentials — NOT real secrets. Every account below uses this same
// password so the password itself never needs to be memorized per-user.
const DEMO_PASSWORD = 'DevPilot@Demo123';

const daysFromNow = (n) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d;
};

const run = async () => {
  await connectDB();

  console.log('Clearing existing demo-relevant collections...');
  await Promise.all([
    Notification.deleteMany({}),
    Comment.deleteMany({}),
    ActivityLog.deleteMany({}),
    Meeting.deleteMany({}),
    Bug.deleteMany({}),
    Task.deleteMany({}),
    Sprint.deleteMany({}),
    Project.deleteMany({}),
    User.deleteMany({}),
    Organization.deleteMany({}),
  ]);

  console.log('Creating organization...');
  const org = await Organization.create({ name: 'Acme Software Solutions' });

  console.log('Creating demo users...');
  const admin = await User.create({
    name: 'Ava Administrator',
    email: 'admin@devpilot.ai',
    password: DEMO_PASSWORD,
    role: 'Admin',
    organization: org._id,
  });
  org.owner = admin._id;
  await org.save();

  const manager = await User.create({
    name: 'Priya Manager',
    email: 'pm@devpilot.ai',
    password: DEMO_PASSWORD,
    role: 'Project Manager',
    organization: org._id,
  });

  const dev1 = await User.create({
    name: 'Diego Developer',
    email: 'dev1@devpilot.ai',
    password: DEMO_PASSWORD,
    role: 'Developer',
    organization: org._id,
  });

  const dev2 = await User.create({
    name: 'Maya Coder',
    email: 'dev2@devpilot.ai',
    password: DEMO_PASSWORD,
    role: 'Developer',
    organization: org._id,
  });

  const tester = await User.create({
    name: 'Tariq Tester',
    email: 'tester@devpilot.ai',
    password: DEMO_PASSWORD,
    role: 'Tester',
    organization: org._id,
  });

  const stakeholder = await User.create({
    name: 'Sam Stakeholder',
    email: 'stakeholder@devpilot.ai',
    password: DEMO_PASSWORD,
    role: 'Stakeholder',
    organization: org._id,
  });

  console.log('Creating demo project: E-Commerce Platform...');
  const project = await Project.create({
    name: 'E-Commerce Platform',
    description:
      'A full-featured online storefront: catalog browsing, cart, checkout, payments, and order management.',
    organization: org._id,
    manager: manager._id,
    members: [dev1._id, dev2._id, tester._id, stakeholder._id],
    status: 'ACTIVE',
    startDate: daysFromNow(-30),
    endDate: daysFromNow(30),
    riskLevel: 'MEDIUM',
    riskExplanation:
      'Two critical bugs remain open against the checkout flow and one task is overdue, but sprint velocity is on track.',
    riskUpdatedAt: new Date(),
  });

  console.log('Creating sprints...');
  const sprint1 = await Sprint.create({
    name: 'Sprint 1 — Foundations',
    goal: 'Stand up authentication, product catalog, and base storefront layout.',
    project: project._id,
    status: 'COMPLETED',
    startDate: daysFromNow(-30),
    endDate: daysFromNow(-16),
    createdBy: manager._id,
  });

  const sprint2 = await Sprint.create({
    name: 'Sprint 2 — Cart & Checkout',
    goal: 'Implement shopping cart, checkout flow, and payment gateway integration.',
    project: project._id,
    status: 'ACTIVE',
    startDate: daysFromNow(-15),
    endDate: daysFromNow(-1),
    createdBy: manager._id,
  });

  const sprint3 = await Sprint.create({
    name: 'Sprint 3 — Orders & Notifications',
    goal: 'Order history, order status tracking, and email/notification hooks.',
    project: project._id,
    status: 'PLANNED',
    startDate: daysFromNow(0),
    endDate: daysFromNow(14),
    createdBy: manager._id,
  });

  console.log('Creating tasks...');
  const tasksData = [
    // Sprint 1 — all done
    { title: 'Set up React + Vite storefront shell', sprint: sprint1._id, assignee: dev1._id, status: 'DONE', priority: 'HIGH', storyPoints: 3 },
    { title: 'Implement JWT authentication (register/login)', sprint: sprint1._id, assignee: dev2._id, status: 'DONE', priority: 'CRITICAL', storyPoints: 5 },
    { title: 'Build product catalog listing & detail pages', sprint: sprint1._id, assignee: dev1._id, status: 'DONE', priority: 'HIGH', storyPoints: 5 },
    { title: 'Design database schema for products & categories', sprint: sprint1._id, assignee: dev2._id, status: 'DONE', priority: 'MEDIUM', storyPoints: 3 },
    // Sprint 2 — active, spread across columns
    { title: 'Implement shopping cart (add/remove/update quantity)', sprint: sprint2._id, assignee: dev1._id, status: 'DONE', priority: 'HIGH', storyPoints: 5 },
    { title: 'Build checkout form with address & shipping selection', sprint: sprint2._id, assignee: dev2._id, status: 'IN_REVIEW', priority: 'HIGH', storyPoints: 5 },
    { title: 'Integrate Stripe payment gateway', sprint: sprint2._id, assignee: dev1._id, status: 'IN_PROGRESS', priority: 'CRITICAL', storyPoints: 8, dueDate: daysFromNow(-2) },
    { title: 'Apply cart totals & tax calculation logic', sprint: sprint2._id, assignee: dev2._id, status: 'IN_PROGRESS', priority: 'MEDIUM', storyPoints: 3 },
    { title: 'Write QA test plan for checkout flow', sprint: sprint2._id, assignee: tester._id, status: 'TODO', priority: 'MEDIUM', storyPoints: 2 },
    { title: 'Add cart persistence across sessions', sprint: sprint2._id, assignee: null, status: 'TODO', priority: 'LOW', storyPoints: 2 },
    // Sprint 3 — planned, mostly todo
    { title: 'Build order history page', sprint: sprint3._id, assignee: dev1._id, status: 'TODO', priority: 'MEDIUM', storyPoints: 3 },
    { title: 'Order status tracking timeline component', sprint: sprint3._id, assignee: dev2._id, status: 'TODO', priority: 'MEDIUM', storyPoints: 3 },
    { title: 'Email notification service for order updates', sprint: sprint3._id, assignee: null, status: 'TODO', priority: 'LOW', storyPoints: 5, aiGenerated: true },
  ];

  const tasks = [];
  for (const t of tasksData) {
    // eslint-disable-next-line no-await-in-loop
    const task = await Task.create({ ...t, project: project._id, createdBy: manager._id });
    tasks.push(task);
  }

  const checkoutTask = tasks.find((t) => t.title.startsWith('Integrate Stripe'));
  const cartTask = tasks.find((t) => t.title.startsWith('Implement shopping cart'));

  console.log('Creating bugs...');
  const bugsData = [
    {
      title: 'Checkout fails silently when Stripe returns a card decline',
      description: 'When a test card is declined, the checkout page shows a blank screen instead of an error message.',
      severity: 'CRITICAL',
      priority: 'CRITICAL',
      status: 'OPEN',
      reporter: tester._id,
      assignedDeveloper: dev1._id,
      relatedTask: checkoutTask?._id || null,
      stepsToReproduce: '1. Add item to cart\n2. Proceed to checkout\n3. Use Stripe test card 4000000000000002\n4. Submit payment',
      expectedResult: 'User sees a clear "card declined" message and can retry.',
      actualResult: 'Page goes blank; console shows an unhandled promise rejection.',
    },
    {
      title: 'Cart quantity resets to 1 after page refresh',
      description: 'Updating item quantity in the cart does not persist across a browser refresh.',
      severity: 'MEDIUM',
      priority: 'MEDIUM',
      status: 'IN_PROGRESS',
      reporter: tester._id,
      assignedDeveloper: dev2._id,
      relatedTask: cartTask?._id || null,
      stepsToReproduce: '1. Add item to cart\n2. Change quantity to 3\n3. Refresh the page',
      expectedResult: 'Quantity remains 3 after refresh.',
      actualResult: 'Quantity resets to 1.',
    },
    {
      title: 'Product image lazy-loading causes layout shift',
      description: 'Product grid images pop in late, causing a visible layout jump on slower connections.',
      severity: 'LOW',
      priority: 'LOW',
      status: 'RESOLVED',
      reporter: stakeholder._id,
      assignedDeveloper: dev1._id,
      stepsToReproduce: '1. Throttle network to Slow 3G\n2. Open product catalog page',
      expectedResult: 'Image placeholders reserve space so layout does not shift.',
      actualResult: 'Grid items shift down as images load in.',
    },
    {
      title: 'Duplicate order confirmation emails sent',
      description: 'Some customers report receiving the order confirmation email twice.',
      severity: 'HIGH',
      priority: 'HIGH',
      status: 'OPEN',
      reporter: manager._id,
      assignedDeveloper: null,
      stepsToReproduce: 'Place an order and monitor the configured email inbox.',
      expectedResult: 'Exactly one confirmation email per order.',
      actualResult: 'Two identical emails arrive roughly a minute apart.',
    },
  ];

  const bugs = [];
  for (const b of bugsData) {
    // eslint-disable-next-line no-await-in-loop
    const bug = await Bug.create({ ...b, project: project._id });
    bugs.push(bug);
  }

  console.log('Creating comments...');
  await Comment.create({
    entityType: 'Task',
    entityId: checkoutTask._id,
    project: project._id,
    author: dev1._id,
    content: `Stripe webhook signature verification is in place; investigating the decline path now. @${manager.name} flagging this may slip past sprint end.`,
    mentions: [manager._id],
  });

  await Comment.create({
    entityType: 'Bug',
    entityId: bugs[0]._id,
    project: project._id,
    author: tester._id,
    content: 'Confirmed reproducible on both Chrome and Firefox. Attaching console logs separately.',
  });

  console.log('Creating a sample AI-summarized meeting...');
  await Meeting.create({
    project: project._id,
    title: 'Sprint 2 Mid-Sprint Sync',
    notes:
      'Discussed checkout blocker with Stripe declines, agreed Diego takes point through Thursday. Maya to finish tax calc by Wednesday. Tariq to draft QA plan in parallel. Flagged risk that checkout won\'t be done by sprint end if the Stripe issue isn\'t resolved by Friday.',
    summary:
      'Team reviewed Sprint 2 progress; the Stripe checkout decline bug is the primary blocker and carries schedule risk if unresolved by Friday.',
    keyDecisions: ['Diego owns the Stripe decline bug through Thursday.', 'Maya finishes tax calculation logic by Wednesday.'],
    actionItems: [
      { description: 'Fix Stripe decline handling on checkout', assignee: dev1._id, assigneeName: 'Diego Developer', deadline: daysFromNow(2) },
      { description: 'Finish cart tax calculation logic', assignee: dev2._id, assigneeName: 'Maya Coder', deadline: daysFromNow(1) },
      { description: 'Draft QA test plan for checkout', assignee: tester._id, assigneeName: 'Tariq Tester', deadline: daysFromNow(3) },
    ],
    discussionPoints: ['Risk of missing sprint end date if Stripe bug persists past Friday.'],
    createdBy: manager._id,
  });

  console.log('Creating notifications...');
  await Notification.create([
    {
      user: dev1._id,
      type: 'BUG_ASSIGNED',
      message: 'You were assigned bug "Checkout fails silently when Stripe returns a card decline"',
      relatedEntity: { entityType: 'Bug', entityId: bugs[0]._id },
    },
    {
      user: dev2._id,
      type: 'TASK_ASSIGNED',
      message: 'You were assigned task "Apply cart totals & tax calculation logic"',
      relatedEntity: { entityType: 'Task', entityId: tasks.find((t) => t.title.startsWith('Apply cart totals'))._id },
    },
    {
      user: manager._id,
      type: 'MENTION',
      message: 'Diego Developer mentioned you on a task comment',
      relatedEntity: { entityType: 'Task', entityId: checkoutTask._id },
      read: true,
    },
    {
      user: tester._id,
      type: 'SPRINT_DEADLINE',
      message: 'Sprint 2 — Cart & Checkout ends soon',
      relatedEntity: { entityType: 'Sprint', entityId: sprint2._id },
    },
  ]);

  console.log('Recomputing project progress...');
  const allTasks = await Task.find({ project: project._id }).select('status');
  const done = allTasks.filter((t) => t.status === 'DONE').length;
  project.progress = Math.round((done / allTasks.length) * 100);
  await project.save();

  console.log('\nSeed complete!\n');
  console.log('Demo credentials (all accounts share the same password):');
  console.log(`  Password: ${DEMO_PASSWORD}\n`);
  console.table([
    { role: 'Admin', email: admin.email },
    { role: 'Project Manager', email: manager.email },
    { role: 'Developer', email: dev1.email },
    { role: 'Developer', email: dev2.email },
    { role: 'Tester', email: tester.email },
    { role: 'Stakeholder', email: stakeholder.email },
  ]);

  await mongoose.connection.close();
  process.exit(0);
};

run().catch((error) => {
  console.error('Seeding failed:', error);
  process.exit(1);
});
