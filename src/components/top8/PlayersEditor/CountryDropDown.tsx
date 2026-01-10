import { useMemo } from "react";
import * as countryList from "country-list";
import startCase from "lodash/startCase";

import { DropDownSelect } from "@/components/top8/DropDownSelect/DropDownSelect";

type Props = {
  selectedCountry: string;
  onCountryChange: (country: string) => void;
  disabled?: boolean;
};

console.log(Object.entries(countryList.getNameList()));

export const CountryDropDown = ({
  selectedCountry,
  onCountryChange,
  disabled,
}: Props) => {
  const options = useMemo(() => {
    return Object.entries(countryList.getNameList()).map(([name, code]) => ({
      id: code,
      value: code,
      display: startCase(name),
      imageSrc: `/assets/flags/${code.toLowerCase()}.svg`,
    }));
  }, []);

  const handleChange = (country: string) => {
    onCountryChange(country);
  };

  return (
    <DropDownSelect
      disabled={disabled}
      options={options}
      selectedValue={selectedCountry}
      onChange={handleChange}
      placeholder="Select Country"
    />
  );
};
