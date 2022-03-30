import { useState } from "react";
import logo from "./logo.svg";
import "./App.css";

const defaultCode = `package main 
import "fmt" 

func main() {
  fmt.Println("henlo world")
}`;

function App() {
  const [code, setCode] = useState(defaultCode);
  const [output, setOutput] = useState("");

  const onSubmit = (e) => {
    e.preventDefault();

    fetch("/exec", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        codez: code,
      }),
    })
      .then((response) => response.json())
      .then((json) => setOutput(json.result));
  };

  return (
    <div className="App">
      <header className="App-header">
        <div style={{ display: "flex", flexDirection: "row", gap: 20 }}>
          <form name="code" onSubmit={onSubmit}>
            <textarea
              name="codez"
              cols="100"
              rows="50"
              spellcheck="false"
              value={code}
              onChange={(e) => setCode(e.target.value)}
            ></textarea>
            <div>
              <button type="submit">Run the codez!</button>
            </div>
          </form>
          <div>
            Result:
            <pre>
              <code id="result">{output}</code>
            </pre>
          </div>
        </div>
      </header>
    </div>
  );
}

export default App;
