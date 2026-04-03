
const Loader = ({ size = 'md', text = '' }) => {
  const sizes = {
    sm: 'w-5 h-5 border-2',
    md: 'w-10 h-10 border-2',
    lg: 'w-16 h-16 border-4',
  };

  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <div
        className={`${sizes[size]} rounded-full border-gray-700 border-t-brand-500 animate-spin`}
      />
      {text && <p className="text-gray-400 text-sm">{text}</p>}
    </div>
  );
};

export const FullPageLoader = ({ text = 'Loading...' }) => (
  <div className="min-h-screen bg-dark-900 flex items-center justify-center">
    <Loader size="lg" text={text} />
  </div>
);

export default Loader;