// Auth pages (login, setup) get their own layout with no sidebar
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
