// scripts/seed.js
// Script to seed the database with initial data
/* eslint-disable no-console */

import { PrismaClient } from '../prisma/generated/client/index.js';
import { hash } from 'bcrypt';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const prisma = new PrismaClient();

// Define permissions directly in this script to avoid importing TypeScript files
const PERMISSIONS = {
  // User management
  USER_MANAGEMENT: 'user_management',
  MANAGE_ROLES: 'manage_roles',
  MANAGE_PERMISSIONS: 'manage_permissions',

  // Project management
  PROJECT_CREATION: 'project_creation',
  PROJECT_MANAGEMENT: 'project_management',
  PROJECT_DELETION: 'project_deletion',

  // Team management
  TEAM_MANAGEMENT: 'team_management',
  TEAM_ADD: 'team_add',
  TEAM_REMOVE: 'team_remove',
  TEAM_VIEW: 'team_view',

  // Task management
  TASK_CREATION: 'task_creation',
  TASK_ASSIGNMENT: 'task_assignment',
  TASK_MANAGEMENT: 'task_management',
  TASK_DELETION: 'task_deletion',

  // General permissions
  VIEW_PROJECTS: 'view_projects',
  EDIT_PROFILE: 'edit_profile',
  SYSTEM_SETTINGS: 'system_settings',
  VIEW_DASHBOARD: 'view_dashboard',

  // Attendance
  ATTENDANCE_MANAGEMENT: 'attendance_management',
  VIEW_TEAM_ATTENDANCE: 'view_team_attendance',
};

// Define roles
const ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  USER: 'user',
  GUEST: 'guest',
};

// Define system roles with additional metadata
const SYSTEM_ROLES = {
  admin: {
    name: 'Administrator',
    description: 'Full access to all system features',
    color: 'bg-purple-500', // Purple
  },
  manager: {
    name: 'Manager',
    description: 'Can manage projects, tasks, and team members',
    color: 'bg-blue-500', // Blue
  },
  user: {
    name: 'User',
    description: 'Regular user with limited permissions',
    color: 'bg-green-500', // Green
  },
  guest: {
    name: 'Guest',
    description: 'View-only access to projects',
    color: 'bg-gray-500', // Gray
  },
};

// Permission matrix - which roles have which permissions
const PERMISSION_MATRIX = {
  [ROLES.ADMIN]: [
    PERMISSIONS.USER_MANAGEMENT,
    PERMISSIONS.MANAGE_ROLES,
    PERMISSIONS.MANAGE_PERMISSIONS,
    PERMISSIONS.PROJECT_CREATION,
    PERMISSIONS.PROJECT_MANAGEMENT,
    PERMISSIONS.PROJECT_DELETION,
    PERMISSIONS.TEAM_MANAGEMENT,
    PERMISSIONS.TEAM_ADD,
    PERMISSIONS.TEAM_REMOVE,
    PERMISSIONS.TEAM_VIEW,
    PERMISSIONS.TASK_CREATION,
    PERMISSIONS.TASK_ASSIGNMENT,
    PERMISSIONS.TASK_MANAGEMENT,
    PERMISSIONS.TASK_DELETION,
    PERMISSIONS.VIEW_PROJECTS,
    PERMISSIONS.EDIT_PROFILE,
    PERMISSIONS.SYSTEM_SETTINGS,
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.ATTENDANCE_MANAGEMENT,
    PERMISSIONS.VIEW_TEAM_ATTENDANCE,
  ],
  [ROLES.MANAGER]: [
    PERMISSIONS.PROJECT_CREATION,
    PERMISSIONS.PROJECT_MANAGEMENT,
    PERMISSIONS.TEAM_MANAGEMENT,
    PERMISSIONS.TEAM_ADD,
    PERMISSIONS.TEAM_REMOVE,
    PERMISSIONS.TEAM_VIEW,
    PERMISSIONS.TASK_CREATION,
    PERMISSIONS.TASK_ASSIGNMENT,
    PERMISSIONS.TASK_MANAGEMENT,
    PERMISSIONS.TASK_DELETION,
    PERMISSIONS.VIEW_PROJECTS,
    PERMISSIONS.EDIT_PROFILE,
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.VIEW_TEAM_ATTENDANCE,
  ],
  [ROLES.USER]: [
    PERMISSIONS.TASK_CREATION,
    PERMISSIONS.TASK_MANAGEMENT,
    PERMISSIONS.VIEW_PROJECTS,
    PERMISSIONS.EDIT_PROFILE,
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.TEAM_VIEW,
  ],
  [ROLES.GUEST]: [PERMISSIONS.VIEW_PROJECTS],
};

async function main() {
  // Clear existing data
  await clearExistingData();

  // Seed roles and permissions
  const roles = await seedRoles();
  const permissions = await seedPermissions();
  await seedRolePermissions(roles, permissions);

  // Seed users with roles directly in the User model
  const users = await seedUsers();

  // Create projects with statuses
  const projects = await seedProjects(users);

  // Create team members for projects
  await seedTeamMembers(projects, users);

  // Create tasks for projects
  const tasks = await seedTasks(projects, users);

  // Create task assignments
  await seedTaskAssignees(tasks, users);

  // Create comments on tasks
  await seedComments(tasks, users);

  // Create attendance records
  await seedAttendanceRecords(users, projects, tasks);

  // Create attendance settings
  await seedAttendanceSettings(users);

  // Create events
  await seedEvents(projects);

  // Create documents
  await seedDocuments(users);

  // Create activities
  await seedActivities(users, projects, tasks);

  // Create task attachments
  await seedTaskAttachments(tasks, users);
}

// Clear existing data - be careful with this in production!
async function clearExistingData() {
  // Delete dependent records first to avoid foreign key constraints
  await prisma.rolePermission.deleteMany({});
  await prisma.permission.deleteMany({});
  await prisma.role.deleteMany({});
  await prisma.taskAttachment.deleteMany({});
  await prisma.activity.deleteMany({});
  await prisma.comment.deleteMany({});
  await prisma.document.deleteMany({});
  await prisma.taskAssignee.deleteMany({});
  await prisma.task.deleteMany({});
  await prisma.event.deleteMany({});
  await prisma.projectStatus.deleteMany({});
  await prisma.teamMember.deleteMany({});
  await prisma.attendance.deleteMany({});
  await prisma.attendanceSettings.deleteMany({});
  await prisma.project.deleteMany({});
  await prisma.session.deleteMany({});
  await prisma.account.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.verificationToken.deleteMany({});
}

// Seed roles
async function seedRoles() {
  const roleMap = {};

  // Create roles from the SYSTEM_ROLES object
  for (const [roleId, roleData] of Object.entries(SYSTEM_ROLES)) {
    const role = await prisma.role.create({
      data: {
        name: roleId,
        description: roleData.description,
        color: roleData.color,
      },
    });

    roleMap[roleId] = role;
  }

  return roleMap;
}

// Seed permissions
async function seedPermissions() {
  const permissionMap = {};

  // Get all permissions with metadata
  const allPermissions = getAllPermissionsWithMetadata();

  // Create permissions
  for (const permission of allPermissions) {
    const createdPermission = await prisma.permission.create({
      data: {
        name: permission.id,
        description: permission.description,
        category: permission.category,
      },
    });

    permissionMap[permission.id] = createdPermission;
  }

  return permissionMap;
}

// Seed role-permission relationships
async function seedRolePermissions(roles, permissions) {
  // For each role in the permission matrix
  for (const [roleKey, permissionList] of Object.entries(PERMISSION_MATRIX)) {
    const role = roles[roleKey.toLowerCase()];

    if (!role) {
      continue;
    }

    // For each permission assigned to this role
    for (const permissionKey of permissionList) {
      const permission = permissions[permissionKey];

      if (!permission) {
        continue;
      }

      // Create the role-permission relationship
      await prisma.rolePermission.create({
        data: {
          roleId: role.id,
          permissionId: permission.id,
        },
      });
    }
  }
}

// Helper function to get all permissions with metadata
function getAllPermissionsWithMetadata() {
  return Object.entries(PERMISSIONS).map(([key, value]) => {
    // Convert permission key to a more readable format
    const name = key
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');

    // Determine category based on the permission key
    let category = 'General';
    if (key.includes('USER') || key.includes('ROLE')) {
      category = 'User Management';
    } else if (key.includes('PROJECT')) {
      category = 'Project Management';
    } else if (key.includes('TASK')) {
      category = 'Task Management';
    } else if (key.includes('TEAM')) {
      category = 'Team Management';
    } else if (key.includes('ATTENDANCE')) {
      category = 'Attendance';
    } else if (key.includes('SYSTEM')) {
      category = 'System';
    }

    return {
      id: value,
      name,
      description: `Permission to ${value.replace(/_/g, ' ')}`,
      category,
    };
  });
}

// Seed users
async function seedUsers() {
  const hashedPassword = await hash('password123', 10);

  const usersToCreate = [
    {
      name: 'Admin User',
      email: 'admin@example.com',
      password: hashedPassword,
      role: 'admin',
      department: 'IT',
      jobTitle: 'System Administrator',
      bio: 'System administrator with full access to all features',
      location: 'New York',
      phone: '555-123-4567',
      skills: 'System Administration, Security, DevOps',
    },
    {
      name: 'Project Manager',
      email: 'manager@example.com',
      password: hashedPassword,
      role: 'manager',
      department: 'Product',
      jobTitle: 'Senior Project Manager',
      bio: 'Experienced project manager specializing in software delivery',
      location: 'San Francisco',
      phone: '555-234-5678',
      skills: 'Agile, Scrum, Team Leadership, Risk Management',
    },
    {
      name: 'Regular User',
      email: 'user1@example.com',
      password: hashedPassword,
      role: 'user',
      department: 'Engineering',
      jobTitle: 'Software Developer',
      bio: 'Full-stack developer with 5 years of experience',
      location: 'Chicago',
      phone: '555-345-6789',
      skills: 'JavaScript, React, Node.js, TypeScript',
    },
    {
      name: 'UI Designer',
      email: 'designer@example.com',
      password: hashedPassword,
      role: 'user',
      department: 'Design',
      jobTitle: 'UI/UX Designer',
      bio: 'Creative designer focused on user experience',
      location: 'Los Angeles',
      phone: '555-456-7890',
      skills: 'Figma, Adobe XD, UI Design, Prototyping',
    },
    {
      name: 'QA Tester',
      email: 'tester@example.com',
      password: hashedPassword,
      role: 'user',
      department: 'Quality Assurance',
      jobTitle: 'QA Engineer',
      bio: 'Detail-oriented tester with automation experience',
      location: 'Boston',
      phone: '555-567-8901',
      skills: 'Manual Testing, Automated Testing, Selenium, Jest',
    },
  ];

  const users = {};

  for (const userData of usersToCreate) {
    const { role, ...userDataWithoutRole } = userData;

    // Create user without role field first
    const user = await prisma.user.create({
      data: userDataWithoutRole,
    });

    // Then update the role using a direct SQL query
    await prisma.$executeRaw`UPDATE user SET role = ${role} WHERE id = ${user.id}`;

    users[role === 'user' ? userData.jobTitle.toLowerCase().replace(/\s+/g, '_') : role] = user;
  }

  // Create additional users for team diversity
  const extraUsers = [];
  for (let i = 2; i <= 5; i++) {
    // Create user without role field first
    const extraUser = await prisma.user.create({
      data: {
        name: `User ${i}`,
        email: `user${i}@example.com`,
        password: hashedPassword,
        department: 'Engineering',
        jobTitle: 'Software Developer',
        bio: `User with various skills and experience`,
        location: 'Remote',
        phone: `555-${i}00-${i}${i}${i}${i}`,
        skills: 'JavaScript, Python, React, Node.js',
      },
    });

    // Then update the role using a direct SQL query
    await prisma.$executeRaw`UPDATE user SET role = 'user' WHERE id = ${extraUser.id}`;

    extraUsers.push(extraUser);
  }

  users.extraUsers = extraUsers;
  return users;
}

// Seed projects
async function seedProjects(users) {
  const now = new Date();
  const projectsToCreate = [
    {
      title: 'Website Redesign',
      description: 'Complete redesign of company marketing website with new branding',
      startDate: new Date(now.getFullYear(), now.getMonth() - 2, 15),
      endDate: new Date(now.getFullYear(), now.getMonth() + 2, 15),
      dueDate: new Date(now.getFullYear(), now.getMonth() + 2, 15),
      estimatedTime: 450,
      totalTimeSpent: 280,
      createdById: users.manager.id,
      statuses: [
        {
          name: 'To Do',
          color: '#E5E5E5',
          description: 'Tasks not yet started',
          isDefault: true,
          order: 1,
        },
        {
          name: 'In Progress',
          color: '#3498DB',
          description: 'Tasks currently being worked on',
          isDefault: false,
          order: 2,
        },
        {
          name: 'Review',
          color: '#F39C12',
          description: 'Tasks ready for review',
          isDefault: false,
          order: 3,
        },
        {
          name: 'Done',
          color: '#2ECC71',
          description: 'Completed tasks',
          isDefault: false,
          order: 4,
          isCompletedStatus: true,
        },
      ],
    },
    {
      title: 'Mobile App Development',
      description: 'Develop a new mobile app for iOS and Android platforms',
      startDate: new Date(now.getFullYear(), now.getMonth() - 1, 1),
      endDate: new Date(now.getFullYear(), now.getMonth() + 4, 30),
      dueDate: new Date(now.getFullYear(), now.getMonth() + 4, 30),
      estimatedTime: 800,
      totalTimeSpent: 320,
      createdById: users.manager.id,
      statuses: [
        {
          name: 'Backlog',
          color: '#E5E5E5',
          description: 'Tasks in the backlog',
          isDefault: true,
          order: 1,
        },
        {
          name: 'In Development',
          color: '#3498DB',
          description: 'Tasks in active development',
          isDefault: false,
          order: 2,
        },
        {
          name: 'Testing',
          color: '#F39C12',
          description: 'Tasks in QA testing',
          isDefault: false,
          order: 3,
        },
        {
          name: 'Ready for Release',
          color: '#2ECC71',
          description: 'Tasks ready for production',
          isDefault: false,
          order: 4,
        },
        {
          name: 'Released',
          color: '#27AE60',
          description: 'Tasks in production',
          isDefault: false,
          order: 5,
          isCompletedStatus: true,
        },
      ],
    },
  ];

  const projects = [];

  for (const projectData of projectsToCreate) {
    const { statuses, ...projectDataWithoutStatuses } = projectData;

    const project = await prisma.project.create({
      data: projectDataWithoutStatuses,
    });

    // Create status columns for each project
    for (const statusData of statuses) {
      await prisma.projectStatus.create({
        data: {
          ...statusData,
          projectId: project.id,
        },
      });
    }

    projects.push(project);
  }

  return projects;
}

// Seed team members
async function seedTeamMembers(projects, users) {
  // Map user job titles to keys
  const usersByRole = {};
  for (const [key, user] of Object.entries(users)) {
    if (Array.isArray(user)) continue; // Skip extraUsers array

    if (user.jobTitle === 'Software Developer') {
      usersByRole.software_developer = user;
    } else if (user.jobTitle === 'UI/UX Designer') {
      usersByRole.ui_ux_designer = user;
    } else if (user.jobTitle === 'QA Engineer') {
      usersByRole.qa_engineer = user;
    }
  }

  const regularUsers = [usersByRole.software_developer, ...users.extraUsers].filter(Boolean);
  const allUsers = [
    users.admin,
    users.manager,
    ...regularUsers,
    usersByRole.ui_ux_designer,
    usersByRole.qa_engineer,
  ].filter(Boolean);

  for (const project of projects) {
    // Add all users to the first project (Website Redesign)
    if (project.title === 'Website Redesign') {
      for (const user of allUsers) {
        await prisma.teamMember.create({
          data: {
            projectId: project.id,
            userId: user.id,
          },
        });
      }
    }
    // Add only some users to the second project (Mobile App)
    else if (project.title === 'Mobile App Development') {
      const mobileAppTeam = [
        users.manager,
        usersByRole.software_developer,
        usersByRole.ui_ux_designer,
        usersByRole.qa_engineer,
        users.extraUsers[0],
      ].filter(Boolean);

      for (const user of mobileAppTeam) {
        await prisma.teamMember.create({
          data: {
            projectId: project.id,
            userId: user.id,
          },
        });
      }
    }
  }
}

// Seed tasks
async function seedTasks(projects, users) {
  const tasks = [];
  const now = new Date();

  // Website Redesign project tasks
  const websiteProject = projects.find(p => p.title === 'Website Redesign');
  if (websiteProject) {
    const websiteStatuses = await prisma.projectStatus.findMany({
      where: { projectId: websiteProject.id },
      orderBy: { order: 'asc' },
    });

    const todoStatus = websiteStatuses.find(s => s.name === 'To Do');
    const inProgressStatus = websiteStatuses.find(s => s.name === 'In Progress');
    const reviewStatus = websiteStatuses.find(s => s.name === 'Review');
    const doneStatus = websiteStatuses.find(s => s.name === 'Done');

    // Create parent tasks
    const designTask = await prisma.task.create({
      data: {
        title: 'Design new website layout',
        description: 'Create wireframes and mockups for the new website design',
        priority: 'high',
        dueDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7),
        projectId: websiteProject.id,
        statusId: inProgressStatus?.id,
        order: 1,
        startDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 5),
        estimatedTime: 40,
        timeSpent: 25,
      },
    });
    tasks.push(designTask);

    // Create subtasks for design task
    const designSubtasks = [
      {
        title: 'Create wireframes',
        description: 'Create low-fidelity wireframes for all pages',
        priority: 'medium',
        dueDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 2),
        projectId: websiteProject.id,
        parentId: designTask.id,
        statusId: doneStatus?.id,
        order: 1,
        startDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 5),
        estimatedTime: 16,
        timeSpent: 14,
        completed: true,
      },
      {
        title: 'Create high-fidelity mockups',
        description: 'Create detailed mockups based on approved wireframes',
        priority: 'high',
        dueDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 5),
        projectId: websiteProject.id,
        parentId: designTask.id,
        statusId: inProgressStatus?.id,
        order: 2,
        startDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 2),
        estimatedTime: 24,
        timeSpent: 11,
      },
    ];

    for (const subtaskData of designSubtasks) {
      const subtask = await prisma.task.create({ data: subtaskData });
      tasks.push(subtask);
    }

    // Create more parent tasks
    const developmentTask = await prisma.task.create({
      data: {
        title: 'Develop frontend components',
        description: 'Implement the frontend components based on the design',
        priority: 'medium',
        dueDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 14),
        projectId: websiteProject.id,
        statusId: todoStatus?.id,
        order: 2,
        estimatedTime: 80,
        timeSpent: 0,
      },
    });
    tasks.push(developmentTask);

    const contentTask = await prisma.task.create({
      data: {
        title: 'Create content for website',
        description: 'Write and prepare all content for the new website',
        priority: 'medium',
        dueDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 10),
        projectId: websiteProject.id,
        statusId: todoStatus?.id,
        order: 3,
        estimatedTime: 30,
        timeSpent: 0,
      },
    });
    tasks.push(contentTask);
  }

  // Mobile App Development project tasks
  const mobileProject = projects.find(p => p.title === 'Mobile App Development');
  if (mobileProject) {
    const mobileStatuses = await prisma.projectStatus.findMany({
      where: { projectId: mobileProject.id },
      orderBy: { order: 'asc' },
    });

    const backlogStatus = mobileStatuses.find(s => s.name === 'Backlog');
    const developmentStatus = mobileStatuses.find(s => s.name === 'In Development');
    const testingStatus = mobileStatuses.find(s => s.name === 'Testing');

    // Create parent tasks
    const requirementsTask = await prisma.task.create({
      data: {
        title: 'Define app requirements',
        description: 'Document functional and non-functional requirements for the mobile app',
        priority: 'high',
        dueDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 5),
        projectId: mobileProject.id,
        statusId: developmentStatus?.id,
        order: 1,
        startDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 3),
        estimatedTime: 20,
        timeSpent: 15,
      },
    });
    tasks.push(requirementsTask);

    const uiDesignTask = await prisma.task.create({
      data: {
        title: 'Design UI/UX for mobile app',
        description: 'Create user interface designs and user experience flows',
        priority: 'high',
        dueDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 12),
        projectId: mobileProject.id,
        statusId: backlogStatus?.id,
        order: 2,
        estimatedTime: 60,
        timeSpent: 0,
      },
    });
    tasks.push(uiDesignTask);

    const apiTask = await prisma.task.create({
      data: {
        title: 'Develop API endpoints',
        description: 'Create backend API endpoints for the mobile app',
        priority: 'medium',
        dueDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 20),
        projectId: mobileProject.id,
        statusId: backlogStatus?.id,
        order: 3,
        estimatedTime: 40,
        timeSpent: 0,
      },
    });
    tasks.push(apiTask);

    const testingTask = await prisma.task.create({
      data: {
        title: 'Create test plan',
        description: 'Develop comprehensive test plan for the mobile app',
        priority: 'medium',
        dueDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 8),
        projectId: mobileProject.id,
        statusId: testingStatus?.id,
        order: 4,
        startDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1),
        estimatedTime: 16,
        timeSpent: 4,
      },
    });
    tasks.push(testingTask);
  }

  return tasks;
}

// Seed task assignees
async function seedTaskAssignees(tasks, users) {
  // Map user job titles to keys
  const usersByRole = {};
  for (const [key, user] of Object.entries(users)) {
    if (Array.isArray(user)) continue; // Skip extraUsers array

    if (user.jobTitle === 'Software Developer') {
      usersByRole.software_developer = user;
    } else if (user.jobTitle === 'UI/UX Designer') {
      usersByRole.ui_ux_designer = user;
    } else if (user.jobTitle === 'QA Engineer') {
      usersByRole.qa_engineer = user;
    }
  }

  const regularUsers = [usersByRole.software_developer, ...users.extraUsers].filter(Boolean);
  const allUsers = [
    users.admin,
    users.manager,
    ...regularUsers,
    usersByRole.ui_ux_designer,
    usersByRole.qa_engineer,
  ].filter(Boolean);

  for (const task of tasks) {
    // Assign 1-3 users to each task
    const assigneeCount = Math.floor(Math.random() * 3) + 1;
    const shuffledUsers = [...allUsers].sort(() => 0.5 - Math.random());
    const taskAssignees = shuffledUsers.slice(0, assigneeCount);

    for (const user of taskAssignees) {
      await prisma.taskAssignee.create({
        data: {
          taskId: task.id,
          userId: user.id,
        },
      });
    }
  }
}

// Seed comments
async function seedComments(tasks, users) {
  const commentTemplates = [
    "I've started working on this task. Will update progress soon.",
    'Need some clarification on the requirements. Can we discuss?',
    'This is taking longer than expected due to some technical challenges.',
    "I've completed the first part of this task. Moving on to the next step.",
    'Just pushed my changes. Please review when you have a chance.',
    'Found a bug that needs to be fixed before we can proceed.',
    "Great progress so far! Let's keep up the momentum.",
    'I suggest we change the approach slightly to improve performance.',
    'This is now ready for testing. Let me know if you find any issues.',
    'All requested changes have been implemented. This should be good to go.',
  ];

  // Map user job titles to keys
  const usersByRole = {};
  for (const [key, user] of Object.entries(users)) {
    if (Array.isArray(user)) continue; // Skip extraUsers array

    if (user.jobTitle === 'Software Developer') {
      usersByRole.software_developer = user;
    } else if (user.jobTitle === 'UI/UX Designer') {
      usersByRole.ui_ux_designer = user;
    } else if (user.jobTitle === 'QA Engineer') {
      usersByRole.qa_engineer = user;
    }
  }

  const allUsers = [
    users.admin,
    users.manager,
    usersByRole.software_developer,
    usersByRole.ui_ux_designer,
    usersByRole.qa_engineer,
    ...users.extraUsers,
  ].filter(Boolean);

  for (const task of tasks) {
    // Add 0-5 comments per task
    const commentCount = Math.floor(Math.random() * 6);

    for (let i = 0; i < commentCount; i++) {
      const randomUser = allUsers[Math.floor(Math.random() * allUsers.length)];
      const randomComment = commentTemplates[Math.floor(Math.random() * commentTemplates.length)];

      await prisma.comment.create({
        data: {
          content: randomComment,
          taskId: task.id,
          userId: randomUser.id,
          createdAt: new Date(Date.now() - Math.floor(Math.random() * 7) * 24 * 60 * 60 * 1000), // Random date within last week
        },
      });
    }
  }
}

// Seed attendance records
async function seedAttendanceRecords(users, projects, tasks) {
  // Map user job titles to keys
  const usersByRole = {};
  for (const [key, user] of Object.entries(users)) {
    if (Array.isArray(user)) continue; // Skip extraUsers array

    if (user.jobTitle === 'Software Developer') {
      usersByRole.software_developer = user;
    } else if (user.jobTitle === 'UI/UX Designer') {
      usersByRole.ui_ux_designer = user;
    } else if (user.jobTitle === 'QA Engineer') {
      usersByRole.qa_engineer = user;
    }
  }

  // Get all users
  const allUsers = [
    users.admin,
    users.manager,
    usersByRole.software_developer,
    usersByRole.ui_ux_designer,
    usersByRole.qa_engineer,
    ...users.extraUsers,
  ].filter(Boolean);

  const now = new Date();

  // Create attendance records for the past 30 days
  for (let i = 30; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);

    // Skip weekends (0 = Sunday, 6 = Saturday)
    const dayOfWeek = date.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      continue;
    }

    // Create attendance records for each user
    for (const user of allUsers) {
      // 80% chance of having an attendance record for a given day
      if (Math.random() < 0.8) {
        // Set check-in time (between 8:00 AM and 9:30 AM)
        const checkInHour = 8 + Math.floor(Math.random() * 2);
        const checkInMinute = Math.floor(Math.random() * 60);
        const checkInTime = new Date(date);
        checkInTime.setHours(checkInHour, checkInMinute, 0, 0);

        // Set check-out time (between 4:30 PM and 6:30 PM)
        const checkOutHour = 16 + Math.floor(Math.random() * 3);
        const checkOutMinute = 30 + Math.floor(Math.random() * 30);
        const checkOutTime = new Date(date);
        checkOutTime.setHours(checkOutHour, checkOutMinute, 0, 0);

        // Calculate work hours
        const workHours = (checkOutTime.getTime() - checkInTime.getTime()) / (1000 * 60 * 60);

        // Randomly assign to a project and task
        const randomProject = projects[Math.floor(Math.random() * projects.length)];
        const projectTasks = tasks.filter(t => t.projectId === randomProject.id);
        const randomTask =
          projectTasks.length > 0
            ? projectTasks[Math.floor(Math.random() * projectTasks.length)]
            : null;

        await prisma.attendance.create({
          data: {
            userId: user.id,
            checkInTime,
            checkOutTime,
            checkInLatitude: 40.7128 + (Math.random() - 0.5) * 0.01,
            checkInLongitude: -74.006 + (Math.random() - 0.5) * 0.01,
            checkOutLatitude: 40.7128 + (Math.random() - 0.5) * 0.01,
            checkOutLongitude: -74.006 + (Math.random() - 0.5) * 0.01,
            checkInIpAddress: '192.168.1.' + Math.floor(Math.random() * 255),
            checkOutIpAddress: '192.168.1.' + Math.floor(Math.random() * 255),
            checkInDeviceInfo: 'Chrome on Windows',
            checkOutDeviceInfo: 'Chrome on Windows',
            totalHours: workHours,
            checkInLocationName: 'Office',
            checkOutLocationName: 'Office',
            projectId: randomProject.id,
            taskId: randomTask?.id,
          },
        });
      }
    }
  }

  // Create some attendance records with notes
  for (let i = 0; i < 10; i++) {
    const randomUser = allUsers[Math.floor(Math.random() * allUsers.length)];
    const adjustmentDate = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() - Math.floor(Math.random() * 30)
    );

    await prisma.attendance.create({
      data: {
        userId: randomUser.id,
        checkInTime: new Date(adjustmentDate.setHours(9, 0, 0, 0)),
        checkOutTime: new Date(adjustmentDate.setHours(17, 0, 0, 0)),
        totalHours: 8,
        checkInLocationName: 'Office',
        checkOutLocationName: 'Office',
        notes: 'Manual adjustment approved by HR',
      },
    });
  }
}

// Seed attendance settings
async function seedAttendanceSettings(users) {
  // Map user job titles to keys
  const usersByRole = {};
  for (const [key, user] of Object.entries(users)) {
    if (Array.isArray(user)) continue; // Skip extraUsers array

    if (user.jobTitle === 'Software Developer') {
      usersByRole.software_developer = user;
    } else if (user.jobTitle === 'UI/UX Designer') {
      usersByRole.ui_ux_designer = user;
    } else if (user.jobTitle === 'QA Engineer') {
      usersByRole.qa_engineer = user;
    }
  }

  // Get all users
  const allUsers = [
    users.admin,
    users.manager,
    usersByRole.software_developer,
    usersByRole.ui_ux_designer,
    usersByRole.qa_engineer,
    ...users.extraUsers,
  ].filter(Boolean);

  for (const user of allUsers) {
    await prisma.attendanceSettings.create({
      data: {
        userId: user.id,
        workHoursPerDay: 8,
        workDays: '1,2,3,4,5',
        reminderEnabled: Math.random() > 0.3,
        reminderTime: '09:00',
        autoCheckoutEnabled: Math.random() > 0.7,
        autoCheckoutTime: '17:30',
      },
    });
  }
}

// Seed events
async function seedEvents(projects) {
  const now = new Date();
  const eventTypes = [
    'Team Meeting',
    'Sprint Planning',
    'Sprint Review',
    'Client Demo',
    'Release',
    'Milestone',
    'Deployment',
    'Design Review',
    'Kickoff Meeting',
  ];

  for (const project of projects) {
    // Create 3-8 events per project
    const eventCount = 3 + Math.floor(Math.random() * 6);

    for (let i = 0; i < eventCount; i++) {
      const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
      const daysFromNow = -30 + Math.floor(Math.random() * 60); // Events from 30 days ago to 30 days in future
      const eventDate = new Date(now);
      eventDate.setDate(eventDate.getDate() + daysFromNow);

      await prisma.event.create({
        data: {
          title: `${project.title} - ${eventType}`,
          description: `${eventType} for ${project.title} project`,
          date: eventDate,
          projectId: project.id,
        },
      });
    }
  }
}

// Seed documents
async function seedDocuments(users) {
  // Map user job titles to keys
  const usersByRole = {};
  for (const [key, user] of Object.entries(users)) {
    if (Array.isArray(user)) continue; // Skip extraUsers array

    if (user.jobTitle === 'Software Developer') {
      usersByRole.software_developer = user;
    } else if (user.jobTitle === 'UI/UX Designer') {
      usersByRole.ui_ux_designer = user;
    } else if (user.jobTitle === 'QA Engineer') {
      usersByRole.qa_engineer = user;
    }
  }

  // Get all users
  const allUsers = [
    users.admin,
    users.manager,
    usersByRole.software_developer,
    usersByRole.ui_ux_designer,
    usersByRole.qa_engineer,
    ...users.extraUsers,
  ].filter(Boolean);

  const documentTypes = [
    { name: 'Requirements Doc', fileType: 'pdf', fileSize: 1024 * 1024 },
    { name: 'Design Specs', fileType: 'pdf', fileSize: 2048 * 1024 },
    { name: 'Technical Documentation', fileType: 'pdf', fileSize: 3072 * 1024 },
    { name: 'User Guide', fileType: 'pdf', fileSize: 1536 * 1024 },
    { name: 'Project Plan', fileType: 'xlsx', fileSize: 512 * 1024 },
    { name: 'Budget Report', fileType: 'xlsx', fileSize: 256 * 1024 },
    { name: 'Meeting Minutes', fileType: 'docx', fileSize: 128 * 1024 },
    { name: 'Research Findings', fileType: 'pptx', fileSize: 4096 * 1024 },
  ];

  for (const user of allUsers) {
    // Create 1-3 documents per user
    const docCount = 1 + Math.floor(Math.random() * 3);

    for (let i = 0; i < docCount; i++) {
      const docTemplate = documentTypes[Math.floor(Math.random() * documentTypes.length)];

      await prisma.document.create({
        data: {
          name: `${docTemplate.name} - ${user.name}`,
          description: `${docTemplate.name} uploaded by ${user.name}`,
          fileType: docTemplate.fileType,
          fileSize: docTemplate.fileSize,
          filePath: `/uploads/documents/${Date.now()}_${docTemplate.name.toLowerCase().replace(/\s+/g, '-')}.${docTemplate.fileType}`,
          userId: user.id,
        },
      });
    }
  }
}

// Seed activities
async function seedActivities(users, projects, tasks) {
  // Map user job titles to keys
  const usersByRole = {};
  for (const [key, user] of Object.entries(users)) {
    if (Array.isArray(user)) continue; // Skip extraUsers array

    if (user.jobTitle === 'Software Developer') {
      usersByRole.software_developer = user;
    } else if (user.jobTitle === 'UI/UX Designer') {
      usersByRole.ui_ux_designer = user;
    } else if (user.jobTitle === 'QA Engineer') {
      usersByRole.qa_engineer = user;
    }
  }

  // Get all users
  const allUsers = [
    users.admin,
    users.manager,
    usersByRole.software_developer,
    usersByRole.ui_ux_designer,
    usersByRole.qa_engineer,
    ...users.extraUsers,
  ].filter(Boolean);

  // Create project creation activities
  for (const project of projects) {
    await prisma.activity.create({
      data: {
        action: 'create',
        entityType: 'project',
        entityId: project.id,
        description: `created project "${project.title}"`,
        userId: project.createdById,
        projectId: project.id,
        createdAt: project.createdAt,
      },
    });
  }

  // Create task activities
  for (const task of tasks) {
    // Create task creation activity
    await prisma.activity.create({
      data: {
        action: 'create',
        entityType: 'task',
        entityId: task.id,
        description: `created task "${task.title}"`,
        userId: allUsers[Math.floor(Math.random() * allUsers.length)].id,
        projectId: task.projectId,
        taskId: task.id,
        createdAt: task.createdAt,
      },
    });

    // Create task update activities (50% chance)
    if (Math.random() > 0.5) {
      const updateDate = new Date(task.createdAt);
      updateDate.setDate(updateDate.getDate() + Math.floor(Math.random() * 5) + 1);

      await prisma.activity.create({
        data: {
          action: 'update',
          entityType: 'task',
          entityId: task.id,
          description: `updated task "${task.title}"`,
          userId: allUsers[Math.floor(Math.random() * allUsers.length)].id,
          projectId: task.projectId,
          taskId: task.id,
          createdAt: updateDate,
        },
      });
    }

    // Create completed task activities
    if (task.completed) {
      const randomUser = allUsers[Math.floor(Math.random() * allUsers.length)];
      const completeDate = new Date(task.createdAt);
      completeDate.setDate(completeDate.getDate() + Math.floor(Math.random() * 14) + 1);

      await prisma.activity.create({
        data: {
          action: 'complete',
          entityType: 'task',
          entityId: task.id,
          description: `marked task "${task.title}" as complete`,
          userId: randomUser.id,
          projectId: task.projectId,
          taskId: task.id,
          createdAt: completeDate,
        },
      });
    }
  }
}

// Seed task attachments
async function seedTaskAttachments(tasks, users) {
  // Map user job titles to keys
  const usersByRole = {};
  for (const [key, user] of Object.entries(users)) {
    if (Array.isArray(user)) continue; // Skip extraUsers array

    if (user.jobTitle === 'Software Developer') {
      usersByRole.software_developer = user;
    } else if (user.jobTitle === 'UI/UX Designer') {
      usersByRole.ui_ux_designer = user;
    } else if (user.jobTitle === 'QA Engineer') {
      usersByRole.qa_engineer = user;
    }
  }

  // Get all users
  const allUsers = [
    users.admin,
    users.manager,
    usersByRole.software_developer,
    usersByRole.ui_ux_designer,
    usersByRole.qa_engineer,
    ...users.extraUsers,
  ].filter(Boolean);

  const attachmentTypes = [
    { name: 'Screenshot', fileType: 'png', fileSize: 500 * 1024 },
    { name: 'Design File', fileType: 'psd', fileSize: 2048 * 1024 },
    { name: 'Code Snippet', fileType: 'js', fileSize: 10 * 1024 },
    { name: 'Test Results', fileType: 'pdf', fileSize: 1024 * 1024 },
    { name: 'Mockup', fileType: 'jpg', fileSize: 1536 * 1024 },
    { name: 'Documentation', fileType: 'pdf', fileSize: 768 * 1024 },
  ];

  // Add attachments to 30% of tasks
  for (const task of tasks) {
    if (Math.random() < 0.3) {
      // Add 1-3 attachments per task
      const attachmentCount = 1 + Math.floor(Math.random() * 3);

      for (let i = 0; i < attachmentCount; i++) {
        const attachmentType = attachmentTypes[Math.floor(Math.random() * attachmentTypes.length)];
        const randomUser = allUsers[Math.floor(Math.random() * allUsers.length)];

        await prisma.taskAttachment.create({
          data: {
            filename: `${attachmentType.name} ${i + 1}`,
            fileUrl: `/uploads/tasks/${task.id}/${Date.now()}_${attachmentType.name.toLowerCase().replace(/\s+/g, '-')}.${attachmentType.fileType}`,
            fileSize: attachmentType.fileSize,
            fileType: attachmentType.fileType,
            taskId: task.id,
            userId: randomUser.id,
          },
        });
      }
    }
  }
}

// Execute the main function
main()
  .catch(e => {
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
