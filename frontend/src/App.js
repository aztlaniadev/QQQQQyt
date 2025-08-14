import React from "react";
import "./App.css";

function App() {
  return (
    <div className="App">
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-white mb-6">
            Acode <span className="text-copper">Lab</span>
          </h1>
          <p className="text-xl text-gray-300 mb-8">
            Sistema Q&A para Profissionais de Tecnologia
          </p>
          <div className="space-x-4">
            <button className="bg-copper hover:bg-copper/90 text-black font-semibold px-8 py-3 rounded">
              Começar Agora
            </button>
            <button className="border border-copper text-copper hover:bg-copper hover:text-black px-8 py-3 rounded">
              Explorar Perguntas
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;