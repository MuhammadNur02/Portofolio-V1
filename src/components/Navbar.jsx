import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";

const SECTION_HREFS = ["#Home", "#About", "#Portofolio", "#Testimonials", "#Contact"];

const LanguageToggle = ({ className = "" }) => {
    const { lang, toggleLang } = useLanguage();
    return (
        <button
            onClick={toggleLang}
            aria-label="Toggle language"
            className={`relative flex items-center gap-1 px-1 py-1 rounded-full border border-white/15 bg-white/5 text-xs font-semibold ${className}`}
        >
            <span
                className={`px-2 py-1 rounded-full transition-all duration-300 ${
                    lang === "id"
                        ? "bg-gradient-to-r from-[#fbbf24] to-[#dc2626] text-white"
                        : "text-[#fde8c8]"
                }`}
            >
                ID
            </span>
            <span
                className={`px-2 py-1 rounded-full transition-all duration-300 ${
                    lang === "en"
                        ? "bg-gradient-to-r from-[#fbbf24] to-[#dc2626] text-white"
                        : "text-[#fde8c8]"
                }`}
            >
                EN
            </span>
        </button>
    );
};

const Navbar = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [activeSection, setActiveSection] = useState("Home");
    const { t } = useLanguage();

    const navItems = [
        { href: "#Home", label: t.nav.home },
        { href: "#About", label: t.nav.about },
        { href: "#Portofolio", label: t.nav.portfolio },
        { href: "#Testimonials", label: t.nav.testimonials },
        { href: "#Contact", label: t.nav.contact },
    ];

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
            // Only the hrefs matter here (they never change with the language), so this effect doesn't depend on navItems.
            const sections = SECTION_HREFS.map(href => {
                const section = document.querySelector(href);
                if (section) {
                    return {
                        id: href.replace("#", ""),
                        offset: section.offsetTop - 550,
                        height: section.offsetHeight
                    };
                }
                return null;
            }).filter(Boolean);

            const currentPosition = window.scrollY;
            const active = sections.find(section => 
                currentPosition >= section.offset && 
                currentPosition < section.offset + section.height
            );

            if (active) {
                setActiveSection(active.id);
            }
        };

        window.addEventListener("scroll", handleScroll);
        handleScroll();
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
    }, [isOpen]);

    const scrollToSection = (e, href) => {
        e.preventDefault();
        const section = document.querySelector(href);
        if (section) {
            const top = section.offsetTop - 100;
            window.scrollTo({
                top: top,
                behavior: "smooth"
            });
        }
        setIsOpen(false);
    };

    return (
        <nav
            className={`fixed w-full top-0 z-50 transition-all duration-500 transform-gpu will-change-transform isolate ${
                isOpen
                    ? "bg-[#0a0705]"
                    : scrolled
                    ? "bg-[#0a0705]/50 backdrop-blur-xl"
                    : "bg-transparent"
            }`}
        >
            <div className="mx-auto px-[5%] sm:px-[5%] lg:px-[10%]">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <div className="flex-shrink-0">
                        <a
                            href="#Home"
                            onClick={(e) => scrollToSection(e, "#Home")}
                            className="text-xl font-bold bg-gradient-to-r from-[#dc2626] to-[#fbbf24] bg-clip-text text-transparent"
                        >
                            Julian
                        </a>
                    </div>
        
                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center gap-8">
                        <div className="flex items-center space-x-8">
                            {navItems.map((item) => (
                                <a
                                    key={item.label}
                                    href={item.href}
                                    onClick={(e) => scrollToSection(e, item.href)}
                                    className="group relative px-1 py-2 text-sm font-medium"
                                >
                                    <span
                                        className={`relative z-10 transition-colors duration-300 ${
                                            activeSection === item.href.substring(1)
                                                ? "bg-gradient-to-r from-[#fbbf24] to-[#dc2626] bg-clip-text text-transparent font-semibold"
                                                : "text-[#fde8c8] group-hover:text-white"
                                        }`}
                                    >
                                        {item.label}
                                    </span>
                                    <span
                                        className={`absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-[#fbbf24] to-[#dc2626] transform origin-left transition-transform duration-300 ${
                                            activeSection === item.href.substring(1)
                                                ? "scale-x-100"
                                                : "scale-x-0 group-hover:scale-x-100"
                                        }`}
                                    />
                                </a>
                            ))}
                        </div>
                        <LanguageToggle />
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="md:hidden flex items-center gap-3">
                        <LanguageToggle />
                        <button
                            onClick={() => setIsOpen(!isOpen)}
                            className={`relative p-2 text-[#fde8c8] hover:text-white transition-transform duration-300 ease-in-out transform ${
                                isOpen ? "rotate-90 scale-125" : "rotate-0 scale-100"
                            }`}
                        >
                            {isOpen ? (
                                <X className="w-6 h-6" />
                            ) : (
                                <Menu className="w-6 h-6" />
                            )}
                        </button>
                    </div>
                </div>
            </div>
        
            {/* Mobile Menu */}
            <div
                className={`md:hidden transition-all duration-300 ease-in-out ${
                    isOpen
                        ? "max-h-screen opacity-100"
                        : "max-h-0 opacity-0 overflow-hidden"
                }`}
            >
                <div className="px-4 py-6 space-y-4">
                    {navItems.map((item, index) => (
                        <a
                            key={item.label}
                            href={item.href}
                            onClick={(e) => scrollToSection(e, item.href)}
                            className={`block px-4 py-3 text-lg font-medium transition-all duration-300 ease ${
                                activeSection === item.href.substring(1)
                                    ? "bg-gradient-to-r from-[#fbbf24] to-[#dc2626] bg-clip-text text-transparent font-semibold"
                                    : "text-[#fde8c8] hover:text-white"
                            }`}
                            style={{
                                transitionDelay: `${index * 100}ms`,
                                transform: isOpen ? "translateX(0)" : "translateX(50px)",
                                opacity: isOpen ? 1 : 0,
                            }}
                        >
                            {item.label}
                        </a>
                    ))}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
