import * as React from "react";

interface NavbarProps {
  children: React.ReactNode;
  isBordered?: boolean;
  variant?: "sticky" | "static";
}

interface NavbarBrandProps {
  children: React.ReactNode;
}

interface NavbarToggleProps {
  "aria-label"?: string;
}

interface NavbarCollapseProps {
  children: React.ReactNode;
}

interface NavbarCollapseItemProps {
  children: React.ReactNode;
}

export function Navbar({ children, isBordered, variant }: NavbarProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  const toggleOpen = () => {
    console.log("Toggle clicked, current state:", isOpen);
    setIsOpen(!isOpen);
  };

  // Función recursiva para clonar elementos y pasar props
  const cloneWithProps = (child: any): any => {
    if (!React.isValidElement(child)) {
      return child;
    }

    const props: any = {
      isOpen,
      toggleOpen,
    };

    // Si el hijo tiene children, clonarlos también
    if (child.props.children) {
      props.children = React.Children.map(child.props.children, cloneWithProps);
    }

    return React.cloneElement(child, props);
  };

  return (
    <nav className="navbar">
      {React.Children.map(children, cloneWithProps)}
    </nav>
  );
}

Navbar.Brand = function NavbarBrand({ children, toggleOpen }: any) {
  return (
    <div className="navbar-brand">
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child) && child.type === Navbar.Toggle) {
          return React.cloneElement(child as any, { toggleOpen });
        }
        return child;
      })}
    </div>
  );
};

Navbar.Toggle = function NavbarToggle({ "aria-label": ariaLabel, toggleOpen }: any) {
  return (
    <button
      className="navbar-toggle"
      aria-label={ariaLabel}
      onClick={toggleOpen}
    >
      ☰
    </button>
  );
};

Navbar.Collapse = function NavbarCollapse({ children, isOpen }: any) {
  return (
    <div className={`navbar-collapse ${isOpen ? "show" : ""}`}>
      {children}
    </div>
  );
};

Navbar.CollapseItem = function NavbarCollapseItem({
  children,
}: NavbarCollapseItemProps) {
  return <div className="navbar-collapse-item">{children}</div>;
};
