
const Footer = () => {
  return (
    <footer className="border-t bg-background">
      <div className="container mx-auto py-8 px-4 text-center text-sm text-muted-foreground max-w-screen-xl">
        <p>&copy; {new Date().getFullYear()} paBondi. All rights reserved.</p>
        <p className="mt-1">Your favorite place to shop local.</p>
      </div>
    </footer>
  );
};

export default Footer;
