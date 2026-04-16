import gatitoIcon from '../../../assets/gatito.png';
import huskyIcon from '../../../assets/husky.png';
import conejitoIcon from '../../../assets/conejito.png';
import './PetAvatar.css';

const PET_IMG = { cat: gatitoIcon, dog: huskyIcon, rabbit: conejitoIcon };

export default function PetAvatar({ species, size = 'md', className = '' }) {
  const img = PET_IMG[species] || gatitoIcon;

  return (
    <div className={`pet-avatar pet-avatar-${size} ${className}`}>
      <img src={img} alt={species} className="pet-avatar-img" />
    </div>
  );
}
