import logoUrl from '../assets/logo-clean.png';

/** شعار صفَّة — خلفية شفافة، بدون إطار */
export default function BrandLogo({ className = 'brandLogo', ...props }) {
  return (
    <img
      src={logoUrl}
      alt=""
      role="presentation"
      className={className}
      decoding="async"
      draggable={false}
      {...props}
    />
  );
}
