export const animationDuration = 300;

export const transitionDefaultStyle = {
  transition: `opacity ${animationDuration}ms ease-in-out`,
  opacity: 0,
}

export const transitionStyles = {
  entering: { opacity: 1 },
  entered:  { opacity: 1 },
  exiting:  { opacity: 0 },
  exited:  { opacity: 0 },
  unmounted: {}
};
