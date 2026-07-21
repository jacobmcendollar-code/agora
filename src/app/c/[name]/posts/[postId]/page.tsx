{/* Large thumbnail - click to view full size */}
{post.thumbnail && (
  post.url ? (
    <a
      href={post.url}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-4 block"
    >
      <img
        src={post.thumbnail}
        alt=""
        className="max-h-80 w-full rounded-lg object-cover hover:opacity-95 transition"
      />
    </a>
  ) : (
    <a
      href={post.thumbnail}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-4 block"
    >
      <img
        src={post.thumbnail}
        alt=""
        className="max-h-80 w-full rounded-lg object-cover hover:opacity-95 transition"
      />
    </a>
  )
)}