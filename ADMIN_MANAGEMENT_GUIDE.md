# 🛡️ User Management System Guide

## Overview
The User Management system allows Super Admins to promote and demote users to admin roles through the website interface, eliminating the need for command-line scripts.

## 🚀 Quick Start

### 1. Login as Super Admin
- **Email**: `superadmin@glangetaway.com`
- **Password**: `SuperAdmin123!`

### 2. Access User Management
- Click on **Admin** in the navigation bar
- Select **User Management** from the dropdown
- Only Super Admins can access this page

### 3. Promote Users to Admin
- Browse all users or search by name/email
- Find the user you want to promote
- Click the **Promote** button next to their name
- Confirm the promotion in the dialog

### 4. Demote Admins to Users
- Find the admin you want to demote
- Click the **Demote** button next to their name
- Confirm the demotion in the dialog

## 🎯 Features

### User Search
- **Real-time search** by name or email
- **Instant results** as you type
- **Case-insensitive** matching

### Role Management
- **Visual role badges** with icons:
  - 👑 Super Admin (Purple)
  - 🛡️ Admin (Blue)
  - 👤 User (Gray)

### Security Features
- **Super Admin protection** - Cannot be demoted
- **Confirmation dialogs** for all actions
- **Activity logging** for audit trail

## 📊 User Roles

| Role | Access Level | Can Manage |
|-------|--------------|------------|
| **Super Admin** | Full System Control | All users, resorts, settings |
| **Admin** | Resort Management | Resorts, bookings, reports |
| **User** | Basic Access | Browse, book resorts |

## 🔧 API Endpoints

The system provides these backend endpoints:

### Get All Users
```
GET /api/admin-management/users
```
- Returns all users with roles and details
- Super Admin only

### Search Users
```
GET /api/admin-management/search-users?query=<search_term>
```
- Search by name or email
- Case-insensitive matching
- Returns up to 20 results

### Promote User
```
PUT /api/admin-management/promote-to-admin/:userId
```
- Promotes user to admin role
- Super Admin only

### Demote User
```
PUT /api/admin-management/demote-to-user/:userId
```
- Demotes admin to user role
- Super Admin only

## 🛡️ Security Notes

### Protection Features
- **Super Admin immunity** - Cannot be modified
- **Role validation** - Prevents invalid role changes
- **Authentication required** - All endpoints protected
- **Permission checks** - Frontend and backend validation

### Audit Trail
- All promotions/demotions are logged
- User who performed the action is tracked
- Timestamp recorded for accountability

## 🎨 UI Components

### User Management Page
- **Responsive design** for all devices
- **Loading states** for better UX
- **Error handling** with user feedback
- **Empty states** when no users found

### Role Badges
- **Color-coded** for quick identification
- **Icon indicators** for visual clarity
- **Hover effects** for interactivity

### Action Buttons
- **Promote button** (Green) for users
- **Demote button** (Orange) for admins
- **Disabled state** for Super Admins
- **Loading spinners** during operations

## 🔄 Testing

### Test the System
```bash
cd hotel-booking-backend
npm run test-admin-mgmt
```

### Verify Functionality
1. Login as Super Admin
2. Navigate to User Management
3. Search for existing users
4. Test promotion/demotion
5. Verify role changes take effect

## 🚨 Troubleshooting

### Common Issues

**"Access Denied" Error**
- Ensure you're logged in as Super Admin
- Check your session hasn't expired
- Verify Super Admin account exists

**User Not Found**
- Check the user ID is correct
- Verify user exists in database
- Refresh the user list

**Promotion Failed**
- Check network connection
- Verify backend is running
- Check browser console for errors

### Debug Steps
1. Check browser console (F12)
2. Verify backend logs
3. Test with network tab
4. Run the test script

## 📱 Mobile Support

The User Management system is fully responsive:
- **Mobile navigation** includes User Management
- **Touch-friendly** buttons and dialogs
- **Optimized layout** for small screens
- **Consistent experience** across devices

## 🎯 Best Practices

### For Super Admins
- **Verify user identity** before promoting
- **Document reasons** for role changes
- **Regular audits** of admin users
- **Remove access** when no longer needed

### For System Admins
- **Monitor promotion activity**
- **Backup user data** regularly
- **Test role changes** thoroughly
- **Keep Super Admin secure**

---

## 🎉 Success!

You now have a complete User Management system that allows:
- ✅ Web-based user promotion/demotion
- ✅ No more command-line scripts needed
- ✅ Secure role management
- ✅ Full audit trail
- ✅ Mobile-friendly interface

**Super Admins can now manage user roles directly through the website!** 🛡️
