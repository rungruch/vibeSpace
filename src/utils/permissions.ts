// Utility functions for user permissions and roles

export interface Permission {
  id: string;
  name: string;
  description: string;
}

export interface Role {
  id: string;
  name: string;
  permissions: string[];
}

// Default permissions
export const PERMISSIONS = {

    //draft site permissions focus on flow management
  
    COURSE_OPERATIONS: 'learning_operations', // General course operations
    COURSE_CREATER: 'learning_create', // Course creation permission and management in own courses
    COURSE_MANAGER: 'learning_manage', // Course management permission and access to all courses

    CLASSROOM_OPERATIONS: 'classroom_operations', // General classroom operations
    CLASSROOM_CREATER: 'classroom_create', // Classroom creation permission and management in own classrooms
    CLASSROOM_MANAGER: 'classroom_manage', // Classroom management permission and access to all classrooms

    NEWS_CREATER: 'news_create', // News creation permission and management in own news - no enable permission
    NEWS_MANAGER: 'news_manage', // News management permission and access to all news

    PAGE_CREATER: 'page_create', // Page creation permission and management in own pages - no enable permission
    PAGE_MANAGER: 'page_manage', // Page management permission and access to all pages

    ANNOUNCEMENT_MANAGER: 'announcement_manage', // Announcement management permission and access to all announcements
    USER_MANAGER: 'user_manage', // User management permission and access to all users
    ADMIN_ACCESS: 'admin_access', // Admin access permission for full system access
} as const;

// Default roles with their permissions
export const ROLES: Role[] = [
  {
    id: 'student',
    name: 'นักเรียน',
    permissions: [
      PERMISSIONS.COURSE_OPERATIONS,
      PERMISSIONS.CLASSROOM_OPERATIONS,
    ]
  },
  {
    id: 'instructor',
    name: 'ผู้สอน',
    permissions: [
        PERMISSIONS.COURSE_OPERATIONS,
        PERMISSIONS.COURSE_CREATER,
        PERMISSIONS.CLASSROOM_OPERATIONS,
        PERMISSIONS.CLASSROOM_CREATER
    ]
  },
  {
    id: 'admin',
    name: 'ผู้ดูแลระบบ',
    permissions: [
        PERMISSIONS.COURSE_OPERATIONS,
        PERMISSIONS.COURSE_CREATER,
        PERMISSIONS.COURSE_MANAGER,
        PERMISSIONS.CLASSROOM_OPERATIONS,
        PERMISSIONS.CLASSROOM_CREATER,
        PERMISSIONS.CLASSROOM_MANAGER,
        PERMISSIONS.NEWS_CREATER,
        PERMISSIONS.NEWS_MANAGER,
        PERMISSIONS.PAGE_CREATER,
        PERMISSIONS.PAGE_MANAGER,
        PERMISSIONS.ANNOUNCEMENT_MANAGER,
        PERMISSIONS.USER_MANAGER
    ]
  }
];

// Utility functions
export const getUserRole = (permissions: string[]): string => {
  // Determine user role based on permissions
  if (permissions.includes(PERMISSIONS.ADMIN_ACCESS)) {
    return 'admin';
  } else if (permissions.includes(PERMISSIONS.COURSE_CREATER) ||
             permissions.includes(PERMISSIONS.CLASSROOM_CREATER)) {
    return 'instructor';
  } else {
    return 'student';
  }
};

export const hasPermission = (userPermissions: string[], requiredPermission: string): boolean => {
  return userPermissions.includes(requiredPermission);
};

export const hasAnyPermission = (userPermissions: string[], requiredPermissions: string[]): boolean => {
  return requiredPermissions.some(permission => userPermissions.includes(permission));
};

export const hasAllPermissions = (userPermissions: string[], requiredPermissions: string[]): boolean => {
  return requiredPermissions.every(permission => userPermissions.includes(permission));
};

export const getRolePermissions = (roleId: string): string[] => {
  const role = ROLES.find(r => r.id === roleId);
  return role ? role.permissions : [];
};

export const getUserDisplayRole = (permissions: string[]): string => {
  const role = getUserRole(permissions);
  const roleObj = ROLES.find(r => r.id === role);
  return roleObj ? roleObj.name : 'ผู้ใช้';
};

// Mock function to get user permissions - replace with actual API call
export const fetchUserPermissions = async (employeeCode: string): Promise<string[]> => {
  // This is a mock implementation
  // Replace this with actual API call to get user permissions
  
  // For demo purposes, assign different permissions based on employee code
  if (employeeCode === '680621') {
    return getRolePermissions('admin');
  } else if (employeeCode.startsWith('68')) {
    return getRolePermissions('instructor');
  } else {
    return getRolePermissions('student');
  }
};
