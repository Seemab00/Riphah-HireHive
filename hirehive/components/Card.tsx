// A white box with a thin border. Used everywhere to group things.
// "title" is optional. "children" is whatever you put inside the card.
export default function Card({
  title,
  children,
}: {
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-line bg-white p-5">
      {title && <h2 className="mb-3 text-lg font-bold">{title}</h2>}
      {children}
    </div>
  );
}
