import { useLanguage } from "../context/LanguageContext";

const Footer = () => {
  const { t } = useLanguage();
  const currentYear = new Date().getFullYear();

  return (
    <footer>
      <center>
        <hr className="my-3 border-gray-400 opacity-15 sm:mx-auto lg:my-6 text-center" />
        <span className="block text-sm pb-4 text-gray-500 text-center dark:text-gray-400">
          © {currentYear}{" "}
          <a href="https://portofolio-v1-one-gamma.vercel.app/" className="hover:underline">
            Muhammad Nurrahman Juliansyah
          </a>
          . {t.footer.rights}
        </span>
      </center>
    </footer>
  );
};

export default Footer;