export default function CustomContainer({children, className = ``}) {
  return <>
    <div className={`container my-5 ${className}`}>
      <div className="row justify-content-center">
        <div className="col-md-10">{children}</div>
      </div>
    </div>
  </>
}
