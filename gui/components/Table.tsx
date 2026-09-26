import * as React from "react";

interface TableProps {
  children: React.ReactNode;
  selectionMode?: "single" | "multiple";
  onSelectionChange?: (keys: Set<string>) => void;
  css?: any;
  style?: React.CSSProperties;
  striped?: boolean;
  sticked?: boolean;
  "aria-label"?: string;
}

interface TableHeaderProps {
  children: React.ReactNode;
}

interface TableColumnProps {
  children: React.ReactNode;
}

interface TableBodyProps {
  children: React.ReactNode;
}

interface TableRowProps {
  children: React.ReactNode;
  key?: string;
}

interface TableCellProps {
  children: React.ReactNode;
}

export function Table({
  children,
  selectionMode,
  onSelectionChange,
  css,
  style,
  ...props
}: TableProps) {
  const handleRowClick = (key: string) => {
    if (selectionMode && onSelectionChange) {
      onSelectionChange(new Set([key]));
    }
  };

  return (
    <div className="table-wrapper">
      <table className="table" style={style} {...props}>
        {React.Children.map(children, (child) => {
          if (React.isValidElement(child)) {
            return React.cloneElement(child as any, { onRowClick: handleRowClick });
          }
          return child;
        })}
      </table>
    </div>
  );
}

Table.Header = function TableHeader({ children }: TableHeaderProps) {
  return (
    <thead>
      <tr>{children}</tr>
    </thead>
  );
};

Table.Column = function TableColumn({ children, align, style }: any) {
  const finalStyle = align ? { textAlign: align, ...(style || {}) } : style;
  return <th style={finalStyle}>{children}</th>;
};

Table.Body = function TableBody({ children, onRowClick }: any) {
  return (
    <tbody>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          //React never passes "key" as a prop, hand it over as rowKey
          return React.cloneElement(child as any, {
            onRowClick,
            rowKey: child.key,
          });
        }
        return child;
      })}
    </tbody>
  );
};

Table.Row = function TableRow({ children, onRowClick, rowKey, ...props }: any) {
  const handleClick = () => {
    if (onRowClick && rowKey !== null && rowKey !== undefined) {
      onRowClick(String(rowKey));
    }
  };

  return (
    <tr onClick={handleClick} {...props}>
      {children}
    </tr>
  );
};

Table.Cell = function TableCell({ children, style, align }: any) {
  const finalStyle = align ? { textAlign: align, ...(style || {}) } : style;
  return <td style={finalStyle}>{children}</td>;
};
