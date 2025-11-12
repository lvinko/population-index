type SpinnerSize = 'sm' | 'md' | 'lg';

type SpinnerProps = {
  size?: SpinnerSize;
};

const sizeClassMap: Record<SpinnerSize, { wrapper: string; circle: string }> = {
  sm: {
    wrapper: 'h-4 w-4',
    circle: 'h-4 w-4 border-2',
  },
  md: {
    wrapper: 'h-8 w-8',
    circle: 'h-8 w-8 border-4',
  },
  lg: {
    wrapper: 'h-12 w-12',
    circle: 'h-12 w-12 border-4',
  },
};

const Spinner = ({ size = 'md' }: SpinnerProps) => {
  const classes = sizeClassMap[size] ?? sizeClassMap.md;

  return (
    <div className={`flex justify-center items-center ${classes.wrapper}`}>
      <div
        className={`animate-spin ${classes.circle} border-gray-200 rounded-full border-t-blue-500`}
      />
    </div>
  );
};

export { Spinner };
