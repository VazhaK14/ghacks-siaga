import { Button } from "@siaga-app/ui/components/button";

export default function DesignSystem() {
  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-8 text-h1">Design System</h1>

      <section className="mb-10">
        <h2 className="mb-4 text-h4">Button</h2>
        <div className="flex flex-wrap items-center gap-4">
          <Button variant="primary">Primary</Button>
          <Button variant="destructive">Destructive</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="link">Link</Button>
          <Button variant="stroke">Stroke</Button>
        </div>
      </section>
    </div>
  );
}
