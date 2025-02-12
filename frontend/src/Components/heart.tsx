import { useEffect, useRef, useState } from "react";
import heart from './../assets/heart.png';
import '../styles/heart.css'

export function Heart(){
    const x = useRef<number>(Math.random()*window.innerWidth);
    const y = useRef<number>(Math.random()*window.innerHeight);
    
    const animationReference = useRef(0);
    const heartRef = useRef<HTMLImageElement>(null);

    const speed = 5;
    const angle = Math.random() * 2* Math.PI;
    const velocityX = speed*Math.cos(angle);
    const velocityY = speed*Math.sin(angle);

    const move = ()=>{
        x.current+= velocityX; y.current+=velocityY;
        
        if(x.current >= window.innerWidth) x.current = 0;
        if(x.current < 0) x.current = window.innerWidth;

        if(y.current >= window.innerHeight) y.current = 0;
        if(y.current < 0) y.current = window.innerHeight; 
        
        if(heartRef.current){
            heartRef.current.style.transform = `translate(${x.current}px, ${y.current}px)`;
        }
        console.log(x.current);
        console.log(y.current);
        animationReference.current = requestAnimationFrame(move);
    }

    useEffect(()=>{
        animationReference.current = requestAnimationFrame(move);
        return ()=>{
            cancelAnimationFrame(animationReference.current);
        }
    }, [])

    return (
        <img ref = {heartRef} src={heart} id = 'heart'/>
    );

}