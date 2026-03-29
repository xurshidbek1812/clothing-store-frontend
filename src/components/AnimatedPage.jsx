import { motion } from 'framer-motion';

const AnimatedPage = ({ children }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }} // Boshlang'ich holati: ko'rinmas va biroz pastda
      animate={{ opacity: 1, y: 0 }}  // Kelish holati: to'liq ko'rinadi va o'z joyiga chiqadi
      exit={{ opacity: 0, y: -15 }}   // Ketish holati: tepaga qarab yo'qoladi
      transition={{ duration: 0.4, ease: "easeOut" }} // Animatsiya tezligi va silliqligi
      className="w-full"
    >
      {children}
    </motion.div>
  );
};

export default AnimatedPage;