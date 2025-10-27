# Skeleton Loaders Guide

This guide explains the different skeleton loader types available and how to use them on different pages.

## Available Skeleton Loader Types

### 1. `dashboard`
**Use for:** Main dashboard pages with stats, tabs, and complex layouts
**Example usage:**
```jsx
<SkeletonLoader type="dashboard" />
```
**Applied to:**
- AdminDashboard
- RegistrarDashboard

### 2. `detail`
**Use for:** Detail/view pages showing specific items
**Example usage:**
```jsx
<SkeletonLoader type="detail" />
```
**Applied to:**
- AdminClassroomDetail

### 3. `list`
**Use for:** Pages showing lists of items
**Example usage:**
```jsx
<SkeletonLoader type="list" />
```
**Applied to:**
- AdminCommunicationPage

### 4. `card-grid`
**Use for:** Pages displaying content in a grid of cards
**Example usage:**
```jsx
<SkeletonLoader type="card-grid" />
```
**Best for:** 
- Course catalogs
- Product listings
- Library pages

### 5. `table`
**Use for:** Pages with data tables
**Example usage:**
```jsx
<SkeletonLoader type="table" />
```
**Best for:**
- User management tables
- Transaction listings
- Report pages

### 6. `stats`
**Use for:** Pages showing statistic cards only
**Example usage:**
```jsx
<SkeletonLoader type="stats" />
```
**Best for:**
- Analytics dashboards
- Metric overview pages

### 7. `form`
**Use for:** Pages with input forms
**Example usage:**
```jsx
<SkeletonLoader type="form" />
```
**Best for:**
- Create/Edit pages
- Settings pages

### 8. `simple-stats`
**Use for:** Pages with stats and card grids combined
**Example usage:**
```jsx
<SkeletonLoader type="simple-stats" />
```
**Best for:**
- Dashboard overviews
- Stats + content grids

### 9. `card`
**Use for:** Single card skeleton
**Example usage:**
```jsx
<SkeletonLoader type="card" count={3} />
```
**Best for:**
- Simple card layouts

## How to Apply to New Pages

### Step 1: Import the SkeletonLoader
```jsx
import SkeletonLoader from '../components/SkeletonLoader';
```

### Step 2: Add Loading Check Before Return
```jsx
if (loading) {
  return (
    <DashboardLayout role="admin">
      <SkeletonLoader type="appropriate-type" />
    </DashboardLayout>
  );
}
```

### Step 3: Choose the Right Type
Based on your page layout, choose the appropriate type:

| Page Layout | Skeleton Type |
|-------------|--------------|
| Dashboard with stats & tabs | `dashboard` |
| Single item detail page | `detail` |
| List of items | `list` |
| Grid of cards | `card-grid` |
| Data table | `table` |
| Just stat cards | `stats` |
| Create/Edit form | `form` |
| Stats + cards | `simple-stats` |

## Current Implementation Status

✅ **Admin Pages:**
- AdminDashboard - uses `dashboard`
- AdminUserManagement - uses `dashboard`
- AdminClassroomManagement - uses `dashboard`
- AdminClassroomDetail - uses `detail`
- AdminCommunicationPage - uses `list`
- AdminAttendance - uses custom inline skeletons

✅ **Registrar Pages:**
- RegistrarDashboard - uses `dashboard`

✅ **Hostel Manager Pages:**
- HostelManagerDashboard - uses inline table row skeletons
- HostelManagementPage - uses inline card grid skeletons

## Custom Inline Skeletons

For pages that need specific loading states (like tables loading within a page), you can create inline skeletons:

### Table Row Skeletons
```jsx
{loading ? (
  [...Array(3)].map((_, index) => (
    <tr key={index} className="animate-pulse">
      <td className="px-6 py-4"><div className="h-12 bg-gray-200 dark:bg-gray-700 rounded"></div></td>
      {/* More cells... */}
    </tr>
  ))
) : (
  // Actual content
)}
```

### Card Grid Skeletons
```jsx
{loading ? (
  [...Array(6)].map((_, index) => (
    <div key={index} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 animate-pulse">
      <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
      {/* More elements... */}
    </div>
  ))
) : (
  // Actual content
)}
```

## Best Practices

1. **Match the Layout:** Always choose a skeleton type that matches your page layout
2. **Use DashboardLayout:** Always wrap skeleton loaders in DashboardLayout when appropriate
3. **Set Loading State:** Remember to set `loading` to `false` after data loads
4. **Consistent Styling:** Use the same colors (`bg-gray-200 dark:bg-gray-700`) for consistency
5. **Animate:** Always include `animate-pulse` class for the loading effect

## Example: Adding to a New Page

```jsx
import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import SkeletonLoader from '../components/SkeletonLoader';

export default function MyNewPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Fetch data...
      setData(response);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout role="admin">
        <SkeletonLoader type="card-grid" />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="admin">
      {/* Your content */}
    </DashboardLayout>
  );
}
```

## Troubleshooting

**Skeleton looks odd on my page:**
- Check if you chose the right type
- Consider creating inline skeletons for specific sections
- Match the skeleton structure to your actual content layout

**Skeleton doesn't show:**
- Ensure `loading` state is set to `true` initially
- Check that you're returning the skeleton before the main content
- Verify the DashboardLayout wrapper

**Skeleton is too wide/narrow:**
- Adjust the skeleton structure to match your grid columns
- Use inline skeletons for more control

