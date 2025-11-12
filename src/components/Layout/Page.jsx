export default function Page({ children, full = false }) {
  return (
    <div className={`${full ? 'w-full px-0' : 'max-w-6xl mx-auto px-4'} py-8`}>
      {children}
    </div>
  );
}
