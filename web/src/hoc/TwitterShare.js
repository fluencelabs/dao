const TwitterShare =
  (Component) =>
  ({ caption, url = "", target = "_blank", hashtags = "", ...props }) => {
    const formattedText = caption.replace(" ", "%20");

    return (
      <a
        href={`https://twitter.com/intent/tweet?text=${formattedText}&url=${url}&hashtags=${hashtags}`}
        target={target}
      >
        <Component {...props} />
      </a>
    );
  };

export default TwitterShare;
