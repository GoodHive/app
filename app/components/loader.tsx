export const Loader = () => {
  return (
    <div className="w-100 flex justify-center">
    <div
      className="animate-spin inline-block w-8 h-8 border-[3px] border-current border-t-transparent text-[#ffc905] rounded-full dark:text-[#ffc905]"
      role="status"
      aria-label="loading"
    >
      <span className="sr-only">Loading...</span>
    </div>
    </div>
  );
};
