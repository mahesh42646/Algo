import Image from "next/image";

export default function Register() {
  return (
    <div
      className="min-vh-100 d-flex justify-content-center align-items-center"
      style={{
        background: "#f3f5fe",
      }}
    >
      <div
        className="bg-white rounded-4 shadow-card w-100"
        style={{ maxWidth: "720px" }}
      >
        {/* Header */}
        <div className="text-center py-3 border-bottom">
          <h6 className="mb-0 fw-semibold text-dark">Register</h6>
        </div>

        {/* Logo */}
        <div className="text-center my-4">
          <div
            className="mx-auto d-flex align-items-center justify-content-center rounded-circle"
            style={{
              width: "80px",
              height: "80px",
              background: "linear-gradient(135deg, #ff9800, #ffb74d)",
              borderRadius: "10px",
              padding: "10px",
              border: "1px solid #dce3f1",
              fontSize: "14px",
            }}
          >
            <Image src="/robot.png" alt="AlgoBot" width={100} height={100} />
          </div>
          <h5 className="fw-bold mt-3 text-primary">AlgoBot</h5>
        </div>

        {/* Form */}
        <div className="px-4 pb-4">
          {/* Email */}
          <div className="mb-4">
            <label className="fw-semibold small text-dark mb-1">
              E-mail
            </label>
            <input
              type="email"
              className="form-control custom-input"
              placeholder="Please enter the e-mail"
            />
          </div>

          {/* Verification Code */}
          <div className="mb-4">
            <label className="fw-semibold small text-dark mb-1">
              Verification Code
            </label>
            <div className="d-flex gap-2">
              <input
                type="text"
                className="form-control custom-input"
                placeholder="Enter verification code"
              />
              <button className="btn btn-outline-primary btn-sm px-3">
                Send
              </button>
            </div>
          </div>

          {/* Password */}
          <div className="mb-4">
            <label className="fw-semibold small text-dark mb-1">
              Login Password
            </label>
            <input
              type="password"
              className="form-control custom-input"
              placeholder="6–20 digits password"
            />
          </div>

          {/* Confirm Password */}
          <div className="mb-4">
            <label className="fw-semibold small text-dark mb-1">
              Confirm Password
            </label>
            <input
              type="password"
              className="form-control custom-input"
              placeholder="Confirm password"
            />
          </div>

          {/* Invitation Code */}
          <div className="mb-4">
            <label className="fw-semibold small text-dark mb-1">
              Invitation Code
            </label>
            <input
              type="text"
              className="form-control custom-input fw-bold"
              value="P3Z5N"
              readOnly
            />
          </div>

          {/* Register Button */}
          <button
            className="btn w-100 py-2 fw-semibold text-white"
            style={{
              background: "linear-gradient(135deg, #ff9800, #ff5722)",
              border: "none",
            }}
          >
            Register
          </button>

          {/* Download */}
          <div className="text-center mt-4 small text-muted">
            Download
          </div>
        </div>
      </div>

      
    </div>
  );
}
