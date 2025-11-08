import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Page from "../components/Layout/Page";

export default function Join() {
  const [code, setCode] = useState("");
  const navigate = useNavigate();

  const join = (e) => {
    e.preventDefault();
    // TODO: validate against backend
    navigate(`/waiting/${code || "ABC123"}`);
  };

  return (
    <Page>
      <div className="max-w-md">
        <h2 className="text-2xl font-bold mb-4">Join Lobby</h2>
        <form onSubmit={join} className="space-y-6">
          <label className="form-control ">
            <span className="label label-text ">Lobby ID</span>
            <input className="input input-bordered rounded-2xl w-xs m-4" value={code} onChange={e=>setCode(e.target.value)} />
          </label>
          <button className="btn btn-outline rounded-2xl w-xs" type="submit">Join</button>
        </form>
        <div className="mt-3">
          <Link to="/home" className="link">Back</Link>
        </div>
      </div>
    </Page>
  );
}
