export default function PageWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="container py-8 px-4 flex-grow max-w-none">
      {children}
    </div>
  );
}
