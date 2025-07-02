// FadeInOnScroll.tsx
import {motion, useInView} from "framer-motion";
import {useRef} from "react";

const FadeInOnScroll = ({children, delay = 0, y = 20}: {children: React.ReactNode; delay?: number; y?: number}) => {
    const ref = useRef(null);
    const isInView = useInView(ref, {once: true, margin: "-100px"});

    return (
        <motion.div
            ref={ref}
            initial={{opacity: 0, y}}
            animate={isInView ? {opacity: 1, y: 0} : {}}
            transition={{duration: 0.6, ease: "easeOut", delay}}
        >
            {children}
        </motion.div>
    );
};

export default FadeInOnScroll;
