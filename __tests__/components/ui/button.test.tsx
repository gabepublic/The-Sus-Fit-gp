import React from 'react';
import { render, screen } from '@testing-library/react';
import { Button, buttonVariants } from '../../../src/components/ui/button';

describe('Button', () => {
  describe('Button component', () => {
    it('should render with default props', () => {
      render(<Button>Click me</Button>);
      
      const button = screen.getByRole('button', { name: 'Click me' });
      expect(button).toBeInTheDocument();
      expect(button).toHaveAttribute('data-slot', 'button');
    });

    it('should render with custom className', () => {
      render(<Button className="custom-class">Custom Button</Button>);
      
      const button = screen.getByRole('button', { name: 'Custom Button' });
      expect(button).toHaveClass('custom-class');
    });

    it('should render with all button variants', () => {
      const variants = ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link'] as const;
      
      variants.forEach(variant => {
        const { unmount } = render(
          <Button variant={variant} data-testid={`button-${variant}`}>
            {variant} button
          </Button>
        );
        
        const button = screen.getByTestId(`button-${variant}`);
        expect(button).toBeInTheDocument();
        expect(button).toHaveTextContent(`${variant} button`);
        
        unmount();
      });
    });

    it('should render with all button sizes', () => {
      const sizes = ['default', 'sm', 'lg', 'icon'] as const;
      
      sizes.forEach(size => {
        const { unmount } = render(
          <Button size={size} data-testid={`button-${size}`}>
            {size} button
          </Button>
        );
        
        const button = screen.getByTestId(`button-${size}`);
        expect(button).toBeInTheDocument();
        expect(button).toHaveTextContent(`${size} button`);
        
        unmount();
      });
    });

    it('should render as child when asChild is true', () => {
      render(
        <Button asChild>
          <a href="/test">Link Button</a>
        </Button>
      );
      
      const link = screen.getByRole('link', { name: 'Link Button' });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', '/test');
      expect(link).toHaveAttribute('data-slot', 'button');
    });

    it('should pass through additional props', () => {
      render(
        <Button 
          data-testid="test-button"
          aria-label="Test button"
          disabled
        >
          Test
        </Button>
      );
      
      const button = screen.getByTestId('test-button');
      expect(button).toHaveAttribute('aria-label', 'Test button');
      expect(button).toBeDisabled();
    });

    it('should handle click events', () => {
      const handleClick = jest.fn();
      render(<Button onClick={handleClick}>Click me</Button>);
      
      const button = screen.getByRole('button', { name: 'Click me' });
      button.click();
      
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should render with icon and text', () => {
      render(
        <Button>
          <span>Icon</span>
          <svg data-testid="icon" />
        </Button>
      );
      
      const button = screen.getByRole('button');
      expect(button).toHaveTextContent('Icon');
      expect(screen.getByTestId('icon')).toBeInTheDocument();
    });
  });

  describe('buttonVariants', () => {
    it('should generate correct class names for default variant', () => {
      const className = buttonVariants({ variant: 'default' });
      expect(className).toContain('bg-primary');
      expect(className).toContain('text-primary-foreground');
    });

    it('should generate correct class names for destructive variant', () => {
      const className = buttonVariants({ variant: 'destructive' });
      expect(className).toContain('bg-destructive');
      expect(className).toContain('text-white');
    });

    it('should generate correct class names for outline variant', () => {
      const className = buttonVariants({ variant: 'outline' });
      expect(className).toContain('border');
      expect(className).toContain('bg-background');
    });

    it('should generate correct class names for secondary variant', () => {
      const className = buttonVariants({ variant: 'secondary' });
      expect(className).toContain('bg-secondary');
      expect(className).toContain('text-secondary-foreground');
    });

    it('should generate correct class names for ghost variant', () => {
      const className = buttonVariants({ variant: 'ghost' });
      expect(className).toContain('hover:bg-accent');
      expect(className).toContain('hover:text-accent-foreground');
    });

    it('should generate correct class names for link variant', () => {
      const className = buttonVariants({ variant: 'link' });
      expect(className).toContain('text-primary');
      expect(className).toContain('underline-offset-4');
    });

    it('should generate correct class names for default size', () => {
      const className = buttonVariants({ size: 'default' });
      expect(className).toContain('h-9');
      expect(className).toContain('px-4');
    });

    it('should generate correct class names for sm size', () => {
      const className = buttonVariants({ size: 'sm' });
      expect(className).toContain('h-8');
      expect(className).toContain('px-3');
    });

    it('should generate correct class names for lg size', () => {
      const className = buttonVariants({ size: 'lg' });
      expect(className).toContain('h-10');
      expect(className).toContain('px-6');
    });

    it('should generate correct class names for icon size', () => {
      const className = buttonVariants({ size: 'icon' });
      expect(className).toContain('size-9');
    });

    it('should combine variant and size classes', () => {
      const className = buttonVariants({ variant: 'destructive', size: 'lg' });
      expect(className).toContain('bg-destructive');
      expect(className).toContain('h-10');
    });

    it('should include custom className when provided', () => {
      const className = buttonVariants({ className: 'custom-class' });
      expect(className).toContain('custom-class');
    });

    it('should use default variants when none provided', () => {
      const className = buttonVariants({});
      expect(className).toContain('bg-primary'); // default variant
      expect(className).toContain('h-9'); // default size
    });
  });
}); 