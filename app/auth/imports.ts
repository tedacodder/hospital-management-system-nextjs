type user={
    "user_id":number
    ,"first_name":string
    ,"last_name":string,
    "date_of_birth":null|string,
    "gender":string,
    "address":null|string,
    "email":string
    ,"password":string
    ,"phone":string
}
export let user_data:user[];

export const fetchData = async (): Promise<void> => {
  try {
    const res = await fetch("http://localhost:5000/login");
    const json = await res.json();
    user_data = json;
    console.log(json);
    return json;
  } catch (err) {
    console.error(err);
  }
}
    