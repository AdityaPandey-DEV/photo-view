export const dynamic = 'force-static';
export const revalidate = false;

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
