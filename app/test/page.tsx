import { useGetAllpatientQuery } from "../redux/api/patients";
const test = () => {
  const patients = useGetAllpatientQuery(0);
  console.log(patients);
  return <p>sucess</p>;
};
export default test;