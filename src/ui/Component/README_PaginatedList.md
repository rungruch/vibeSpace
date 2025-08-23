# PaginatedList Component

A reusable component for displaying paginated lists with both desktop table and mobile card views.

## Features
- Generic TypeScript implementation for type safety
- Responsive design (table on desktop, cards on mobile)
- Built-in loading and empty states
- Automatic pagination handling
- Theme-aware styling

## Usage

```tsx
import PaginatedList from './PaginatedList';

<PaginatedList
  items={filteredItems}
  isLoading={isLoading}
  pageSize={10}
  emptyTitle="No items found"
  emptyDescription="Start by creating your first item"
  rowKey={(item) => item.id}
  renderDesktopHeader={
    <tr>
      <th>Column 1</th>
      <th>Column 2</th>
    </tr>
  }
  renderDesktopRow={(item) => (
    <tr>
      <td>{item.name}</td>
      <td>{item.status}</td>
    </tr>
  )}
  renderMobileCard={(item) => (
    <div>
      <h3>{item.name}</h3>
      <p>{item.status}</p>
    </div>
  )}
/>
```

## Props

- `items`: Array of items to display
- `isLoading`: Loading state
- `pageSize`: Number of items per page (default: 10)
- `emptyTitle`: Title when no items
- `emptyDescription`: Description when no items (optional)
- `rowKey`: Function to get unique key for each item
- `renderDesktopHeader`: Desktop table header
- `renderDesktopRow`: Desktop table row renderer
- `renderMobileCard`: Mobile card renderer

## Used In
- `PageSetting.tsx` - Page management list
- `FormsListCustom.tsx` - Form management list
