import mthLogo from '../assets/mth-logo.png';

export default function DisplayHeader() {
  return (
    <header className="display-header">
      <h1 className="display-header__title">WILLKOMMEN IM MEDIATECH HUB POTSDAM</h1>
      <img className="display-header__logo" src={mthLogo} alt="Mediatech Hub Potsdam" />
    </header>
  );
}
