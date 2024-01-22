import { useEffect, useState } from "react";

import type { NextPage } from "next";
import Link from "next/link";

import NavBar from "../components/NavBar";
import Title from "../components/Title";

const Home: NextPage = () => {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setLoaded(true);
  }, []);

  return !loaded ? (
    <></>
  ) : (
    <div className="px-10">
      <Title />

      <div className="navbar bg-base-100">
        <NavBar />
      </div>

      <div className="mx-40 my-10">
        <Link href="/staking">
          <button className="btn btn-primary m-5">Enter Staking App</button>
        </Link>
      </div>
    </div>
  );
};

export default Home;
