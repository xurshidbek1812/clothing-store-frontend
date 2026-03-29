import { motion } from 'framer-motion';

const Loader = () => {
  return (
    <div className="w-full h-[50vh] flex flex-col items-center justify-center">
      {/* Aylanuvchi va shakli o'zgaruvchi premium animatsiya */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          rotate: [0, 180, 360],
          borderRadius: ["20%", "50%", "20%"],
        }}
        transition={{
          duration: 2,
          ease: "easeInOut",
          times: [0, 0.5, 1],
          repeat: Infinity,
        }}
        className="w-16 h-16 bg-blue-600/10 border-4 border-blue-600 flex items-center justify-center shadow-[0_0_20px_rgba(37,99,235,0.3)]"
      >
        <motion.div 
          animate={{ scale: [1, 1.5, 1] }}
          transition={{ duration: 1, repeat: Infinity }}
          className="w-4 h-4 bg-blue-600 rounded-full"
        />
      </motion.div>

      {/* O'chib-yonuvchi yozuv */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: [0.3, 1, 0.3] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        className="mt-8 text-blue-600 font-bold tracking-[0.2em] uppercase text-xs"
      >
        Ma'lumotlar yuklanmoqda...
      </motion.p>
    </div>
  );
};

export default Loader;