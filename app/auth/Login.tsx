import Navbar from "../../components/Navbar";
import style from "./style/Login.module.css";
// import { useNavigate } from "react-router-dom";
// import { useForm } from "react-form-hook";
import { useState, useEffect, ChangeEvent } from "react";
// import { AuthContext } from "./authcontex";
import { setExportValue } from "./store";
import { ThemeProvider } from "../../components/theme";
export interface prop {
  onlogin: (status: boolean) => void;
}

function Login({ onlogin }: prop) {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [Data, setData] = useState<[] | null>(null);
  // const { setEmails } = useContext(AuthContext)!;

  // const navigate = useNavigate();

  // const response = await fetch("http://localhost:5000/login",
  //   {
  //     method: "GET",
  //     headers: {
  //       "Content-Type": "application/json",
  //     },
  //   }
  // )

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("http://localhost:5000/login");
        const json = await res.json();
        setData(json);

        console.log(json);
      } catch (err) {
        console.error(err);
      }
    };
    fetchData();
  }, []);

  // const { register, handleSubmit } = useForm();
  const element = [
    { pathname: "Home", path: "/" },
    { pathname: "Login", path: "/login" },
    { pathname: "Signup", path: "/signup" },
  ];

  return (
    <>
      <ThemeProvider>
        <Navbar items={element}></Navbar>
      </ThemeProvider>

      <form>
        <div className={style.login}>
          <div className="mb-3">
            <label htmlFor="exampleInputEmail1" className="form-label">
              Email address
            </label>
            <input
              type="email"
              className="form-control"
              id="exampleInputEmail1"
              aria-describedby="emailHelp"
              onChange={(e: ChangeEvent<HTMLInputElement>) => {
                setEmail(e.target.value);
              }}
            />
            <div id="emailHelp" className="form-text">
              We'll never share your email with anyone else.
            </div>
          </div>
          <div className="mb-3">
            <label htmlFor="exampleInputPassword1" className="form-label">
              Password
            </label>
            <input
              type="password"
              className="form-control"
              id="exampleInputPassword1"
              onChange={(e: ChangeEvent<HTMLInputElement>) => {
                setPassword(e.target.value);
              }}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            onClick={() => {
              Data.map((user) => {
                try {
                  if (user.email === email && user.password === password) {
                    onlogin(true);
                    setExportValue(email);
                    alert("login successful");
                  }
                } catch (err) {
                  console.error(err);
                }
              });
            }}
          >
            Login
          </button>
        </div>
      </form>
    </>
  );
}

export default Login;
