/**
 * OptimizedImage — wrapper autour de next/image
 * 
 * Utilisation :
 *   import OptimizedImage from "@/app/components/OptimizedImage";
 *   <OptimizedImage src="/photo.jpg" alt="Description" width={400} height={300} />
 * 
 * Pour les images Firebase Storage ou URLs externes :
 *   <OptimizedImage src="https://firebasestorage.googleapis.com/..." alt="..." width={400} height={300} />
 */
import Image from "next/image";

export default function OptimizedImage({
  src,
  alt,
  width,
  height,
  priority = false,
  className,
  style,
  fill = false,
  objectFit = "cover",
}) {
  if (!src) return null;

  if (fill) {
    return (
      <div style={{ position: "relative", ...style }} className={className}>
        <Image
          src={src}
          alt={alt || ""}
          fill
          priority={priority}
          style={{ objectFit }}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt || ""}
      width={width}
      height={height}
      priority={priority}
      className={className}
      style={style}
      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
    />
  );
}
