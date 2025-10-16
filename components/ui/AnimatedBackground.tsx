
import React from 'react';

const AnimatedBackground: React.FC = () => {
    return (
        <div className="absolute top-0 left-0 w-full h-full -z-10 overflow-hidden bg-[#F0F2F5]">
            <style>
                {`
                @keyframes move {
                    100% {
                        transform: translate3d(0, 0, 1px) rotate(360deg);
                    }
                }
                .background {
                    position: fixed;
                    width: 100vw;
                    height: 100vh;
                    top: 0;
                    left: 0;
                    background: #e8edf2;
                    overflow: hidden;
                }
                .background span {
                    width: 20vmin;
                    height: 20vmin;
                    border-radius: 20vmin;
                    backface-visibility: hidden;
                    position: absolute;
                    animation: move;
                    animation-duration: 45s;
                    animation-timing-function: linear;
                    animation-iteration-count: infinite;
                }
                .background span:nth-child(0) {
                    color: #90d5f5;
                    top: 15%;
                    left: 7%;
                    animation-duration: 40s;
                    animation-delay: -2s;
                    transform-origin: -1vw 22vh;
                    box-shadow: 40vmin 0 5.0vmin currentColor;
                }
                .background span:nth-child(1) {
                    color: #a4f5d2;
                    top: 80%;
                    left: 90%;
                    animation-duration: 50s;
                    animation-delay: -5s;
                    transform-origin: 10vw -10vh;
                    box-shadow: -40vmin 0 5.5vmin currentColor;
                }
                .background span:nth-child(2) {
                    color: #d8c2f2;
                    top: 10%;
                    left: 85%;
                    animation-duration: 35s;
                    animation-delay: -7s;
                    transform-origin: -2vw -2vh;
                    box-shadow: 40vmin 0 5.2vmin currentColor;
                }
                 .background span:nth-child(3) {
                    color: #90d5f5;
                    top: 80%;
                    left: 10%;
                    animation-duration: 55s;
                    animation-delay: -1s;
                    transform-origin: 10vw -12vh;
                    box-shadow: -40vmin 0 5.8vmin currentColor;
                }
                `}
            </style>
            <div className="background">
                <span></span>
                <span></span>
                <span></span>
                <span></span>
            </div>
        </div>
    );
};

export default AnimatedBackground;
